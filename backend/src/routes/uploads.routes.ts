import { Router } from 'express';
import { uploadImage, uploadSTLFile, uploadDocument } from '../controllers/uploads.controller.js';
import { authenticate } from '../middleware/auth.js';
import { uploadImage as multerImage, uploadSTL, uploadDocument as multerDoc } from '../middleware/upload.js';

const router = Router();

router.post('/image', authenticate, multerImage.single('file'), uploadImage);
router.post('/stl', authenticate, uploadSTL.single('file'), uploadSTLFile);
router.post('/document', authenticate, multerDoc.single('file'), uploadDocument);

export default router;
