import path from 'path';
import fs   from 'fs';
import { Response } from 'express';
import { uploadToCloudinary } from '../services/cloudinary.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import logger from '../utils/logger.js';

const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const isCloudinaryConfigured = () =>
  !!process.env['CLOUDINARY_CLOUD_NAME'] &&
  process.env['CLOUDINARY_CLOUD_NAME'] !== 'your_cloud_name';

// fallback quando Cloudinary não está configurado: salva localmente e retorna URL relativa
const saveToDisk = (buffer: Buffer, originalName: string): string => {
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(originalName).toLowerCase()}`;
  fs.writeFileSync(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
};

export const uploadImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) { errorResponse(res, 'Nenhum arquivo enviado', 400); return; }
    const url = isCloudinaryConfigured()
      ? await uploadToCloudinary(req.file.buffer ?? fs.readFileSync(path.join(uploadDir, req.file.filename ?? '')), 'images', 'image')
      : `/uploads/${req.file.filename}`;
    successResponse(res, { url }, 'Imagem enviada');
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao fazer upload', 500);
  }
};

export const uploadSTLFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) { errorResponse(res, 'Nenhum arquivo enviado', 400); return; }
    const url = isCloudinaryConfigured()
      ? await uploadToCloudinary(req.file.buffer, 'models', 'raw')
      : saveToDisk(req.file.buffer, req.file.originalname);
    successResponse(res, { url }, 'Arquivo enviado');
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao fazer upload', 500);
  }
};

export const uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) { errorResponse(res, 'Nenhum arquivo enviado', 400); return; }
    const url = isCloudinaryConfigured()
      ? await uploadToCloudinary(req.file.buffer, 'documents', 'image')
      : saveToDisk(req.file.buffer, req.file.originalname);
    successResponse(res, { url }, 'Documento enviado');
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao fazer upload', 500);
  }
};
