import { Response } from 'express';
import { uploadToCloudinary } from '../services/cloudinary.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

export const uploadImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      errorResponse(res, 'Nenhum arquivo enviado', 400);
      return;
    }
    const url = await uploadToCloudinary(req.file.buffer, 'images', 'image');
    successResponse(res, { url }, 'Imagem enviada');
  } catch (err) {
    console.error(err);
    errorResponse(res, 'Erro ao fazer upload', 500);
  }
};

export const uploadSTLFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      errorResponse(res, 'Nenhum arquivo enviado', 400);
      return;
    }
    const url = await uploadToCloudinary(req.file.buffer, 'models', 'raw');
    successResponse(res, { url }, 'Arquivo enviado');
  } catch (err) {
    console.error(err);
    errorResponse(res, 'Erro ao fazer upload', 500);
  }
};

export const uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      errorResponse(res, 'Nenhum arquivo enviado', 400);
      return;
    }
    const url = await uploadToCloudinary(req.file.buffer, 'documents', 'image');
    successResponse(res, { url }, 'Documento enviado');
  } catch (err) {
    console.error(err);
    errorResponse(res, 'Erro ao fazer upload', 500);
  }
};
