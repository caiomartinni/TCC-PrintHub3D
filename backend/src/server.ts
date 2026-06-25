import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/products.routes.js';
import orderRoutes from './routes/orders.routes.js';
import quoteRoutes from './routes/quotes.routes.js';
import makerRoutes from './routes/makers.routes.js';
import categoryRoutes from './routes/categories.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import reviewRoutes from './routes/reviews.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/uploads.routes.js';
import chatRoutes from './routes/chat.routes.js';
import paymentRoutes from './routes/payments.routes.js';
import financeiroRoutes from './routes/financeiro.routes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import prisma from './utils/prisma.js';
import logger from './utils/logger.js';

const app = express();
const PORT = process.env['PORT'] || 3001;

app.use(helmet());
const allowedOrigins = (process.env['CORS_ORIGIN'] || 'http://localhost:5173')
  .split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Cria tabela de solicitações de saque se não existir
prisma.$queryRawUnsafe(`
  CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id          VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL PRIMARY KEY,
    makerId     VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    amount      DECIMAL(10,2) NOT NULL,
    pixKey      VARCHAR(255) NOT NULL,
    pixKeyType  VARCHAR(50)  NOT NULL,
    status      VARCHAR(50)  NOT NULL DEFAULT 'PENDING',
    adminNote   TEXT         NULL,
    createdAt   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (makerId) REFERENCES maker_profiles(id) ON DELETE CASCADE
  )
`).catch(e => logger.error(e as Error, 'Tabela withdrawal_requests'));

// Cria tabela de saques (histórico de saques concluídos) se não existir
prisma.$queryRawUnsafe(`
  CREATE TABLE IF NOT EXISTS saques (
    id             VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL PRIMARY KEY,
    makerId        VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    banco          VARCHAR(191) NOT NULL,
    ultimosDigitos VARCHAR(191) NOT NULL,
    valor          DOUBLE NOT NULL,
    status         ENUM('CONCLUIDO') NOT NULL DEFAULT 'CONCLUIDO',
    dataConclusao  DATETIME(3) NOT NULL,
    createdAt      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    KEY idx_saques_makerId (makerId),
    FOREIGN KEY (makerId) REFERENCES maker_profiles(id) ON DELETE CASCADE
  )
`).catch(e => logger.error(e as Error, 'Tabela saques'));

// Endpoint público de estatísticas para a landing page
app.get('/api/stats', async (_req, res) => {
  try {
    const [totalMakers, totalProducts, totalOrders] = await Promise.all([
      prisma.makerProfile.count({ where: { status: 'ACTIVE' } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
    ]);
    res.json({ success: true, data: { totalMakers, totalProducts, totalOrders } });
  } catch {
    res.json({ success: true, data: { totalMakers: 0, totalProducts: 0, totalOrders: 0 } });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/makers', makerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/chats',   chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/financeiro', financeiroRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`PrintHub3D API rodando na porta ${PORT}`);
  logger.info(`Ambiente: ${process.env['NODE_ENV']}`);
});

export default app;
