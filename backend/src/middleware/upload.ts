import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedModelTypes = /stl|obj|3mf/;
  const ext = path.extname(file.originalname).toLowerCase().slice(1);

  if (allowedImageTypes.test(ext) || allowedModelTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado'));
  }
};

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadSTL = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

export const uploadDocument = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
});
