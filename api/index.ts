import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from '../server/src/routes/auth';
import pointsRoutes from '../server/src/routes/points';
import rulesRoutes from '../server/src/routes/rules';
import shopRoutes from '../server/src/routes/shop';
import redemptionsRoutes from '../server/src/routes/redemptions';
import familyRoutes from '../server/src/routes/family';
import badgesRoutes from '../server/src/routes/badges';

dotenv.config();

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/redemptions', redemptionsRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/badges', badgesRoutes);

// 健康检查
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'NOT_FOUND', message: '请求的资源不存在' });
});

// 错误处理
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: '服务器内部错误' });
});

export default app;
