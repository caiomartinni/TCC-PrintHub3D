import { randomBytes } from 'crypto';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { sendPasswordResetEmail } from '../services/email.service.js';
import logger from '../utils/logger.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, phone, role } = req.body as {
      email: string; password: string; name: string; phone?: string; role?: string;
    };

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      errorResponse(res, 'E-mail já cadastrado', 409);
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const userRole = role === 'MAKER' ? 'MAKER' : 'CLIENT';

    const user = await prisma.user.create({
      data: { email, password: hashed, name, phone, role: userRole as 'MAKER' | 'CLIENT' },
    });

    if (userRole === 'MAKER') {
      // New makers start as PENDING — admin reviews KYC documents before activating
      await prisma.makerProfile.create({ data: { userId: user.id, status: 'PENDING' } });
    }

    const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    successResponse(res, { token, refreshToken, user: { ...payload, avatar: user.avatar, isActive: user.isActive, isVerified: user.isVerified, createdAt: user.createdAt } }, 'Cadastro realizado', 201);
  } catch (err) {
    logger.error(err, 'register');
    errorResponse(res, 'Erro ao cadastrar usuário', 500);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      errorResponse(res, 'Credenciais inválidas', 401);
      return;
    }
    if (!user.isActive) {
      errorResponse(res, 'Conta suspensa ou desativada. Entre em contato com o suporte.', 401);
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      errorResponse(res, 'Credenciais inválidas', 401);
      return;
    }

    const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    successResponse(res, {
      token,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar, isActive: user.isActive, isVerified: user.isVerified, createdAt: user.createdAt },
    }, 'Login realizado');
  } catch (err) {
    logger.error(err, 'login');
    errorResponse(res, 'Erro ao fazer login', 500);
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body as { refreshToken: string };
    if (!token) {
      errorResponse(res, 'Token de refresh necessário', 400);
      return;
    }

    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.isActive) {
      errorResponse(res, 'Usuário inválido', 401);
      return;
    }

    const newPayload = { id: user.id, email: user.email, role: user.role, name: user.name };
    successResponse(res, {
      token: generateToken(newPayload),
      refreshToken: generateRefreshToken(newPayload),
    });
  } catch {
    errorResponse(res, 'Token inválido', 401);
  }
};

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { makerProfile: true },
      omit: { password: true },
    });
    if (!user) {
      errorResponse(res, 'Usuário não encontrado', 404);
      return;
    }
    successResponse(res, user);
  } catch (err) {
    logger.error(err, 'me');
    errorResponse(res, 'Erro interno', 500);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, avatar } = req.body as { name?: string; phone?: string; avatar?: string };
    const data: Record<string, unknown> = {};
    if (name   !== undefined) data['name']   = name;
    if (phone  !== undefined) data['phone']  = phone;
    // empty string means "remove avatar" → store null
    if (avatar !== undefined) data['avatar'] = avatar === '' ? null : avatar;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      omit: { password: true },
    });
    successResponse(res, user, 'Perfil atualizado');
  } catch (err) {
    logger.error(err, 'updateProfile');
    errorResponse(res, 'Erro ao atualizar perfil', 500);
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { password } = req.body as { password: string };
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { errorResponse(res, 'Usuário não encontrado', 404); return; }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) { errorResponse(res, 'Senha incorreta', 400); return; }

    // ── Hard delete: remove records in FK-safe order ──────────────────────────

    // 1. Messages sent by this user
    await prisma.message.deleteMany({ where: { senderId: userId } });

    // 2. Notifications
    await prisma.notification.deleteMany({ where: { userId } });

    // 3. Favorites
    await prisma.favorite.deleteMany({ where: { userId } });

    // 4. Payments
    await prisma.payment.deleteMany({ where: { userId } });

    // 6. Reviews left by this user as client
    await prisma.review.deleteMany({ where: { clientId: userId } });

    // 7. Quote responses from makers linked to this user's maker profile
    const makerProfile = await prisma.makerProfile.findUnique({
      where: { userId }, select: { id: true },
    });
    if (makerProfile) {
      await prisma.quoteResponse.deleteMany({ where: { makerId: makerProfile.id } });
      await prisma.review.deleteMany({ where: { makerId: makerProfile.id } });
    }

    // 8. Quote requests (and their responses cascade)
    const quoteIds = await prisma.quoteRequest.findMany({
      where: { clientId: userId }, select: { id: true },
    });
    if (quoteIds.length > 0) {
      const ids = quoteIds.map(q => q.id);
      await prisma.quoteResponse.deleteMany({ where: { quoteRequestId: { in: ids } } });
      await prisma.quoteRequest.deleteMany({ where: { clientId: userId } });
    }

    // 9. Orders by this user as client (tracking, items, chats)
    const clientOrders = await prisma.order.findMany({
      where: { clientId: userId }, select: { id: true },
    });
    if (clientOrders.length > 0) {
      const orderIds = clientOrders.map(o => o.id);
      // Delete chats and chat messages
      const chats = await prisma.chat.findMany({ where: { orderId: { in: orderIds } }, select: { id: true } });
      if (chats.length > 0) {
        await prisma.message.deleteMany({ where: { chatId: { in: chats.map(c => c.id) } } });
        await prisma.chat.deleteMany({ where: { orderId: { in: orderIds } } });
      }
      await prisma.tracking.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.review.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.order.deleteMany({ where: { clientId: userId } });
    }

    // 10. Orders where this user is the maker
    if (makerProfile) {
      const makerOrders = await prisma.order.findMany({
        where: { makerId: makerProfile.id }, select: { id: true },
      });
      if (makerOrders.length > 0) {
        const mOrderIds = makerOrders.map(o => o.id);
        const mChats = await prisma.chat.findMany({ where: { orderId: { in: mOrderIds } }, select: { id: true } });
        if (mChats.length > 0) {
          await prisma.message.deleteMany({ where: { chatId: { in: mChats.map(c => c.id) } } });
          await prisma.chat.deleteMany({ where: { orderId: { in: mOrderIds } } });
        }
        await prisma.tracking.deleteMany({ where: { orderId: { in: mOrderIds } } });
        await prisma.orderItem.deleteMany({ where: { orderId: { in: mOrderIds } } });
        await prisma.review.deleteMany({ where: { orderId: { in: mOrderIds } } });
        await prisma.order.deleteMany({ where: { makerId: makerProfile.id } });
      }
      // Products of this maker
      await prisma.favorite.deleteMany({ where: { product: { makerId: makerProfile.id } } });
      await prisma.product.deleteMany({ where: { makerId: makerProfile.id } });
    }

    // 11. Addresses (cascade already handles, but just in case)
    await prisma.address.deleteMany({ where: { userId } });

    // 12. Finally delete the user (cascades: makerProfile, notifications, favorites, addresses)
    await prisma.user.delete({ where: { id: userId } });

    successResponse(res, null, 'Conta excluída com sucesso');
  } catch (err) {
    logger.error(err, '[deleteAccount]');
    errorResponse(res, 'Erro ao excluir conta. Tente novamente.', 500);
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      errorResponse(res, 'Usuário não encontrado', 404);
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      errorResponse(res, 'Senha atual incorreta', 400);
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    successResponse(res, null, 'Senha alterada');
  } catch (err) {
    logger.error(err, 'changePassword');
    errorResponse(res, 'Erro ao alterar senha', 500);
  }
};

export const getAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const address =
      await prisma.address.findFirst({ where: { userId: req.user!.id, isDefault: true } })
      ?? await prisma.address.findFirst({ where: { userId: req.user!.id } });
    successResponse(res, address);
  } catch (err) {
    logger.error(err, 'getAddress');
    errorResponse(res, 'Erro ao buscar endereço', 500);
  }
};

export const saveAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { label, street, number, complement, district, city, state, zipCode } = req.body as {
      label: string; street: string; number: string; complement?: string;
      district: string; city: string; state: string; zipCode: string;
    };

    const existing = await prisma.address.findFirst({
      where: { userId: req.user!.id, isDefault: true },
    });

    const data = { label, street, number, complement, district, city, state, zipCode };

    const address = existing
      ? await prisma.address.update({ where: { id: existing.id }, data })
      : await prisma.address.create({ data: { ...data, userId: req.user!.id, isDefault: true } });

    successResponse(res, address, 'Endereço salvo');
  } catch (err) {
    logger.error(err, 'saveAddress');
    errorResponse(res, 'Erro ao salvar endereço', 500);
  }
};

// ── FORGOT PASSWORD ───────────────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email: string };
  logger.info({ email }, '[forgotPassword] iniciando');

  // 1. Busca usuário
  let user: { id: string; name: string; email: string } | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });
  } catch (err) {
    logger.error(err, '[forgotPassword] erro na busca do usuário');
    errorResponse(res, 'Erro ao acessar o banco de dados.', 500); return;
  }

  if (!user) {
    errorResponse(res, 'E-mail não encontrado. Verifique se o endereço está correto.', 404);
    return;
  }

  // 2. Gera token e salva
  try {
    const token  = randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.$queryRawUnsafe(
      'UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?',
      token, expiry, user.id
    );

    // 3. Envia e-mail
    const previewUrl = await sendPasswordResetEmail(user.email, user.name, token);
    successResponse(res, { previewUrl }, 'Link de redefinição enviado para o seu e-mail.');
  } catch (err) {
    logger.error(err, '[forgotPassword] erro ao gerar token/enviar email');
    errorResponse(res, 'Erro ao enviar e-mail. Tente novamente.', 500);
  }
};

// ── VALIDATE RESET TOKEN ──────────────────────────────────────────────────────
export const validateResetToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params as { token: string };

    const rows = await prisma.$queryRawUnsafe<{ id: string; name: string; email: string; resetTokenExpiry: Date }[]>(
      'SELECT id, name, email, resetTokenExpiry FROM users WHERE resetToken = ? LIMIT 1', token
    );

    if (!rows.length) { errorResponse(res, 'Link inválido ou já utilizado.', 400); return; }

    const user = rows[0]!;
    if (new Date() > new Date(user.resetTokenExpiry)) {
      errorResponse(res, 'Link expirado. Solicite um novo.', 400); return;
    }

    const [localPart, domain] = user.email.split('@');
    const masked = (localPart ?? '').slice(0, 3) + '***@' + domain;

    successResponse(res, { name: user.name, email: masked });
  } catch (err) {
    logger.error(err, '[validateResetToken]');
    errorResponse(res, 'Erro ao validar token.', 500);
  }
};

// ── RESET PASSWORD WITH TOKEN ─────────────────────────────────────────────────
export const resetPasswordWithToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body as { token: string; newPassword: string };

    if (!newPassword || newPassword.length < 8) {
      errorResponse(res, 'A senha deve ter no mínimo 8 caracteres.', 400); return;
    }

    const rows = await prisma.$queryRawUnsafe<{ id: string; resetTokenExpiry: Date }[]>(
      'SELECT id, resetTokenExpiry FROM users WHERE resetToken = ? LIMIT 1', token
    );

    if (!rows.length) { errorResponse(res, 'Link inválido ou já utilizado.', 400); return; }

    const user = rows[0]!;
    if (new Date() > new Date(user.resetTokenExpiry)) {
      errorResponse(res, 'Link expirado. Solicite um novo link.', 400); return;
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.$queryRawUnsafe(
      'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?',
      hashed, user.id
    );

    successResponse(res, null, 'Senha redefinida com sucesso! Faça login com a nova senha.');
  } catch (err) {
    logger.error(err, '[resetPasswordWithToken]');
    errorResponse(res, 'Erro ao redefinir senha.', 500);
  }
};
