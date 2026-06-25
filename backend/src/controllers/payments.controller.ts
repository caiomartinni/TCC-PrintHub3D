import { Response } from 'express';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import logger from '../utils/logger.js';

// ── MP client (uses TEST- or PROD- token from .env) ──────────────────────────
const mpClient = new MercadoPagoConfig({
  accessToken: process.env['MERCADO_PAGO_ACCESS_TOKEN'] || 'TEST-placeholder',
  options: { timeout: 10000 },
});

// ── CREATE PREFERENCE (called before showing the Brick) ──────────────────────
export const createPreference = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.body as { orderId: string };
    const userId = req.user!.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: { select: { email: true, name: true } },
        items:  { include: { product: { select: { name: true } } } },
        maker:  { include: { user: { select: { name: true } } } },
      },
    });

    if (!order) { errorResponse(res, 'Pedido não encontrado', 404); return; }
    if (order.clientId !== userId) { errorResponse(res, 'Acesso negado', 403); return; }
    // Check for existing paid payment
    const existingPaid = await prisma.payment.findUnique({ where: { orderId }, select: { status: true } });
    if (existingPaid?.status === 'PAID') { errorResponse(res, 'Pedido já pago', 409); return; }

    const itemTitle = order.notes
      ?? order.items?.[0]?.product?.name
      ?? `Pedido #${order.id.slice(-8).toUpperCase()}`;

    const preference = new Preference(mpClient);

    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:5173';

    const prefResponse = await preference.create({
      body: {
        external_reference: order.id,
        items: [
          {
            id:         order.id.slice(-8),
            title:      itemTitle,
            quantity:   1,
            unit_price: Number(order.total.toFixed(2)),
          },
        ],
        payer: {
          email: order.client.email,
        },
        back_urls: {
          success: `${frontendUrl}/payment/status`,
          failure: `${frontendUrl}/payment/status`,
          pending: `${frontendUrl}/payment/status`,
        },
        // auto_return only works with HTTPS URLs (not localhost)
        // notification_url also requires public HTTPS (use ngrok in production)
        statement_descriptor: 'PRINTHUB3D',
      },
    });

    successResponse(res, {
      preferenceId: prefResponse.id,
      publicKey:    process.env['MERCADO_PAGO_PUBLIC_KEY'] || 'TEST-placeholder',
      orderId:      order.id,
      amount:       order.total,
      title:        itemTitle,
    });
  } catch (err) {
    logger.error(err, '[MP] createPreference');
    errorResponse(res, 'Erro ao criar preferência de pagamento', 500);
  }
};

// ── PROCESS PAYMENT (called by Brick's onSubmit) ─────────────────────────────
export const processPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId  = req.user!.id;
    const { orderId, formData } = req.body as {
      orderId: string;
      formData: Record<string, unknown>;
    };

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { client: { select: { email: true } } },
    });
    if (!order) { errorResponse(res, 'Pedido não encontrado', 404); return; }
    if (order.clientId !== userId) { errorResponse(res, 'Acesso negado', 403); return; }

    const isSandbox = (process.env['MERCADO_PAGO_ACCESS_TOKEN'] || '').startsWith('TEST-');

    // ── SANDBOX SIMULATION ─────────────────────────────────────────────────
    // MP Brazil sandbox prevents test users from the same account from paying
    // each other (Payer email forbidden). In production this works normally.
    // For TCC demo purposes, we simulate a successful payment in sandbox.
    if (isSandbox) {
      const simId = `SANDBOX_${Date.now()}`;

      const existing = await prisma.payment.findUnique({ where: { orderId } });
      const simData  = {
        externalId:     simId,
        externalStatus: 'approved',
        status:         'PAID' as const,
        paidAt:         new Date(),
      };

      if (existing) {
        await prisma.payment.update({ where: { orderId }, data: simData });
      } else {
        await prisma.payment.create({
          data: {
            orderId, userId,
            amount:      order.total,
            platformFee: order.total * 0.05,
            makerAmount: order.total * 0.95,
            ...simData,
          },
        });
      }

      await prisma.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } });

      logger.info({ simId }, '[MP] sandbox simulation — payment approved');
      successResponse(res, {
        paymentId:    simId,
        status:       'approved',
        statusDetail: 'accredited',
        orderId,
        sandbox:      true,
      });
      return;
    }

    // ── PRODUCTION: real MP payment ────────────────────────────────────────
    const mpPayment = new Payment(mpClient);
    const formPayer = (formData['payer'] as Record<string, unknown>) || {};

    const paymentBody = {
      ...formData,
      external_reference: orderId,
      description: `PrintHub3D — Pedido #${orderId.slice(-8).toUpperCase()}`,
      payer: { ...formPayer, email: order.client.email },
    } as Parameters<typeof mpPayment.create>[0]['body'];

    const mpResult = await mpPayment.create({ body: paymentBody });

    // Save/update Payment record in DB
    const existing = await prisma.payment.findUnique({ where: { orderId } });
    const payStatus = mpResult.status === 'approved' ? 'PAID'
                    : mpResult.status === 'pending'  ? 'PROCESSING'
                    : 'FAILED';

    if (existing) {
      await prisma.payment.update({
        where: { orderId },
        data: {
          externalId:     String(mpResult.id),
          externalStatus: mpResult.status,
          status:         payStatus,
          paidAt:         mpResult.status === 'approved' ? new Date() : null,
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId,
          userId,
          amount:         order.total,
          platformFee:    order.total * 0.05,   // 5% plataforma
          makerAmount:    order.total * 0.95,   // 95% maker
          externalId:     String(mpResult.id),
          externalStatus: mpResult.status,
          status:         payStatus,
          paidAt:         mpResult.status === 'approved' ? new Date() : null,
        },
      });
    }

    // Update order status if approved
    if (mpResult.status === 'approved') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CONFIRMED' },
      });
    }

    successResponse(res, {
      paymentId:    mpResult.id,
      status:       mpResult.status,
      statusDetail: mpResult.status_detail,
      orderId,
    });
  } catch (err) {
    const mpErr = err as { cause?: { apiResponse?: { message?: string; error?: string } }; message?: string };
    const mpMsg = mpErr?.cause?.apiResponse?.message
               || mpErr?.cause?.apiResponse?.error
               || mpErr?.message
               || 'Erro ao processar pagamento';
    logger.error({ err, apiResponse: mpErr?.cause?.apiResponse }, `[MP] processPayment: ${mpMsg}`);

    // Give user a helpful message for the most common sandbox error
    if (mpMsg.includes('Payer email forbidden') || mpMsg.includes('forbidden')) {
      errorResponse(res,
        'SANDBOX: Email do comprador inválido. No painel do Mercado Pago Developers, ' +
        'copie o email do usuário de teste COMPRADOR e adicione em backend/.env como ' +
        'MERCADO_PAGO_TEST_BUYER_EMAIL=email@testuser.com',
        422
      );
    } else {
      errorResponse(res, `Pagamento recusado: ${mpMsg}`, 422);
    }
  }
};

// ── GET PAYMENT STATUS (used by Status Screen Brick) ─────────────────────────
export const getPaymentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params as { paymentId: string };

    const mpPayment = new Payment(mpClient);
    const result    = await mpPayment.get({ id: paymentId });

    successResponse(res, {
      paymentId:      result.id,
      status:         result.status,
      statusDetail:   result.status_detail,
      amount:         result.transaction_amount,
      description:    result.description,
      externalRef:    result.external_reference,
    });
  } catch (err) {
    logger.error(err, '[MP] getPaymentStatus');
    errorResponse(res, 'Erro ao buscar status do pagamento', 500);
  }
};

// ── WEBHOOK (Mercado Pago notifies payment updates) ──────────────────────────
export const handleWebhook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, data } = req.body as { type: string; data: { id: string } };

    if (type === 'payment' && data?.id) {
      const mpPayment = new Payment(mpClient);
      const result    = await mpPayment.get({ id: data.id });
      const orderId   = result.external_reference;

      if (orderId) {
        const payStatus = result.status === 'approved' ? 'PAID'
                        : result.status === 'pending'  ? 'PROCESSING'
                        : 'FAILED';

        await prisma.payment.updateMany({
          where: { orderId },
          data:  { externalStatus: result.status, status: payStatus,
                   paidAt: result.status === 'approved' ? new Date() : undefined },
        });

        if (result.status === 'approved') {
          await prisma.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } });
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    logger.error(err, '[MP] webhook');
    res.sendStatus(500);
  }
};
