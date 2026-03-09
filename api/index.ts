// Vercel Serverless Function Entry Point
import express from 'express';
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

// 中间件
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
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
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Children Points System API',
    version: '1.0.0',
    status: 'running'
  });
});

export default app;