// serviço stub para split marketplace do Mercado Pago — ainda não integrado
import logger from '../utils/logger.js';

export interface PaymentData {
  orderId: string;
  amount: number;
  description: string;
  payerEmail: string;
  makerId?: string;
  platformFeeRate?: number;
}

export interface PaymentResult {
  externalId: string;
  status: string;
  checkoutUrl?: string;
  pixCode?: string;
  boletoUrl?: string;
}

export interface SplitConfig {
  makerId: string;
  makerAccessToken: string;
  platformFeeRate: number;
}

class PaymentService {
  private accessToken: string;

  constructor() {
    this.accessToken = process.env['MERCADO_PAGO_ACCESS_TOKEN'] || '';
  }

  async createCheckout(data: PaymentData): Promise<PaymentResult> {
    // TODO: integrar Checkout Pro — POST https://api.mercadopago.com/checkout/preferences
    logger.debug({ data }, '[PaymentService] createCheckout - not yet integrated');
    return {
      externalId: `mock_${Date.now()}`,
      status: 'pending',
      checkoutUrl: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock_${Date.now()}`,
    };
  }

  async createSplitPayment(data: PaymentData, split: SplitConfig): Promise<PaymentResult> {
    // TODO: integrar split marketplace — usa access token com application_fee
    logger.debug({ data, split }, '[PaymentService] createSplitPayment - not yet integrated');
    const makerAmount = data.amount * (1 - split.platformFeeRate);
    const platformFee = data.amount * split.platformFeeRate;
    return {
      externalId: `mock_split_${Date.now()}`,
      status: 'pending',
      checkoutUrl: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock_split_${Date.now()}`,
    };
    void makerAmount;
    void platformFee;
  }

  async getPaymentStatus(externalId: string): Promise<string> {
    // TODO: GET https://api.mercadopago.com/v1/payments/{id}
    logger.debug({ externalId }, '[PaymentService] getPaymentStatus - not yet integrated');
    return 'pending';
  }

  async processWebhook(body: Record<string, unknown>): Promise<void> {
    // TODO: validar assinatura com MERCADO_PAGO_WEBHOOK_SECRET
    logger.info({ body }, '[PaymentService] processWebhook');
  }

  async refund(externalId: string, amount?: number): Promise<void> {
    // TODO: POST https://api.mercadopago.com/v1/payments/{id}/refunds
    logger.debug({ externalId, amount }, '[PaymentService] refund - not yet integrated');
  }

  isConfigured(): boolean {
    return !!this.accessToken;
  }
}

export const paymentService = new PaymentService();
