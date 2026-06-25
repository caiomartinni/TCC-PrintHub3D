import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import logger from '../utils/logger.js';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1', limit = '12', search, category, material,
      minPrice, maxPrice, sortBy = 'createdAt', order = 'desc', featured,
    } = req.query as Record<string, string>;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: Record<string, unknown> = { isActive: true };

    if (search) where['OR'] = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
    if (category) where['category'] = { slug: category };
    if (material) where['material'] = { contains: material };
    if (minPrice || maxPrice) where['price'] = {
      ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
      ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
    };
    if (featured === 'true') where['isFeatured'] = true;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: order },
        include: {
          category: { select: { name: true, slug: true } },
          maker: {
            select: {
              id: true, rating: true, totalReviews: true, city: true, state: true,
              user: { select: { name: true, avatar: true } },
            },
          },
          _count: { select: { favorites: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    paginatedResponse(res, products, total, parseInt(page), parseInt(limit));
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao buscar produtos', 500);
  }
};

export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params as { slug: string };
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        maker: {
          include: {
            user: { select: { name: true, avatar: true } },
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { client: { select: { name: true, avatar: true } } },
        },
        _count: { select: { favorites: true, reviews: true } },
      },
    });

    if (!product) {
      errorResponse(res, 'Produto não encontrado', 404);
      return;
    }

    successResponse(res, product);
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao buscar produto', 500);
  }
};

export const getMyProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const makerProfile = await prisma.makerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!makerProfile) { errorResponse(res, 'Perfil não encontrado', 404); return; }

    const { page = '1', limit = '50' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { makerId: makerProfile.id },
        skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { category: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.product.count({ where: { makerId: makerProfile.id } }),
    ]);

    paginatedResponse(res, products, total, parseInt(page), parseInt(limit));
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao buscar produtos', 500);
  }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const makerProfile = await prisma.makerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!makerProfile || makerProfile.status !== 'ACTIVE') {
      errorResponse(res, 'Perfil de maker não ativo', 403);
      return;
    }

    const data = req.body as {
      name: string; description: string; price: number; categoryId: string;
      material: string; images?: string[]; tags?: string[]; stock?: number;
      color?: string; weight?: number; dimensions?: string; printTime?: number;
    };

    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .concat(`-${Date.now()}`);

    const product = await prisma.product.create({
      data: { ...data, slug, makerId: makerProfile.id },
    });

    successResponse(res, product, 'Produto criado', 201);
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao criar produto', 500);
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const makerProfile = await prisma.makerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!makerProfile) {
      errorResponse(res, 'Perfil de maker não encontrado. Faça login novamente.', 403);
      return;
    }

    const product = await prisma.product.findFirst({ where: { id, makerId: makerProfile.id } });
    if (!product) {
      errorResponse(res, 'Produto não encontrado ou não pertence a você', 403);
      return;
    }

    const updated = await prisma.product.update({ where: { id }, data: req.body });
    successResponse(res, updated, 'Produto atualizado');
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao atualizar produto', 500);
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const makerProfile = await prisma.makerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!makerProfile) {
      errorResponse(res, 'Perfil não encontrado', 404);
      return;
    }

    const product = await prisma.product.findFirst({ where: { id, makerId: makerProfile.id } });
    if (!product) {
      errorResponse(res, 'Produto não encontrado ou sem permissão', 403);
      return;
    }

    await prisma.product.update({ where: { id }, data: { isActive: false } });
    successResponse(res, null, 'Produto removido');
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao remover produto', 500);
  }
};

export const getFavorites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
            maker: {
              select: {
                id: true, rating: true, totalReviews: true, city: true, state: true,
                user: { select: { name: true, avatar: true } },
              },
            },
          },
        },
      },
    });

    const products = favorites
      .filter(f => f.product !== null)
      .map(f => f.product);

    successResponse(res, products);
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao buscar favoritos', 500);
  }
};

export const toggleFavorite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const userId = req.user!.id;

    const existing = await prisma.favorite.findUnique({ where: { userId_productId: { userId, productId: id } } });
    if (existing) {
      await prisma.favorite.delete({ where: { userId_productId: { userId, productId: id } } });
      successResponse(res, { favorited: false }, 'Removido dos favoritos');
    } else {
      await prisma.favorite.create({ data: { userId, productId: id } });
      successResponse(res, { favorited: true }, 'Adicionado aos favoritos');
    }
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao favoritar', 500);
  }
};
