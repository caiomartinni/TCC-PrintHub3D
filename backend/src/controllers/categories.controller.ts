import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../utils/logger.js';

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
      orderBy: { name: 'asc' },
    });
    successResponse(res, categories);
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao buscar categorias', 500);
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, icon, imageUrl } = req.body as {
      name: string; description?: string; icon?: string; imageUrl?: string;
    };
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const category = await prisma.category.create({ data: { name, slug, description, icon, imageUrl } });
    successResponse(res, category, 'Categoria criada', 201);
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao criar categoria', 500);
  }
};
