import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Disk storage — saves locally and returns filename
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  },
});

const memoryStorage = multer.memoryStorage();

const imageFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  allowed.test(ext) ? cb(null, true) : cb(new Error('Apenas imagens são suportadas (jpg, png, webp)'));
};

const modelFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = /stl|obj|3mf/;
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  allowed.test(ext) ? cb(null, true) : cb(new Error('Apenas arquivos STL, OBJ ou 3MF são suportados'));
};

// Used for product images → saves to disk
export const uploadImage = multer({
  storage: diskStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Used for STL files → memory (Cloudinary)
export const uploadSTL = multer({
  storage: memoryStorage,
  fileFilter: modelFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

// Used for KYC documents → memory (Cloudinary)
export const uploadDocument = multer({
  storage: memoryStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});
