import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

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
      await prisma.makerProfile.create({ data: { userId: user.id } });
    }

    const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    successResponse(res, { token, refreshToken, user: { ...payload, avatar: user.avatar } }, 'Cadastro realizado', 201);
  } catch (err) {
    console.error(err);
    errorResponse(res, 'Erro ao cadastrar usuário', 500);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      errorResponse(res, 'Credenciais inválidas', 401);
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
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
    }, 'Login realizado');
  } catch (err) {
    console.error(err);
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
    console.error(err);
    errorResponse(res, 'Erro interno', 500);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone } = req.body as { name?: string; phone?: string };
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, phone },
      omit: { password: true },
    });
    successResponse(res, user, 'Perfil atualizado');
  } catch (err) {
    console.error(err);
    errorResponse(res, 'Erro ao atualizar perfil', 500);
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
    console.error(err);
    errorResponse(res, 'Erro ao alterar senha', 500);
  }
};
