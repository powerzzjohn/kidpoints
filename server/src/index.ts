import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import pointsRoutes from './routes/points';
import rulesRoutes from './routes/rules';
import shopRoutes from './routes/shop';
import redemptionsRoutes from './routes/redemptions';
import familyRoutes from './routes/family';
import badgesRoutes from './routes/badges';
import SocketServer from './socket/socketServer';

// 加载环境变量
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// 中间件
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（仅本地开发）
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static('uploads'));
}

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/redemptions', redemptionsRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/badges', badgesRoutes);

// 根路径
app.get('/', (req, res) => {
  res.json({ 
    message: '儿童积分系统 API',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        profile: 'GET /api/auth/profile',
        updateProfile: 'PUT /api/auth/profile'
      },
      points: {
        balance: 'GET /api/points/balance/:userId?',
        records: 'GET /api/points/records/:userId?',
        add: 'POST /api/points/add',
        deduct: 'POST /api/points/deduct',
        familyMembers: 'GET /api/points/family-members'
      },
      rules: {
        list: 'GET /api/rules',
        detail: 'GET /api/rules/:id',
        create: 'POST /api/rules',
        update: 'PUT /api/rules/:id',
        delete: 'DELETE /api/rules/:id',
        confirm: 'POST /api/rules/:id/confirm',
        pending: 'GET /api/rules/pending/confirmations'
      },
      shop: {
        items: 'GET /api/shop/items',
        itemDetail: 'GET /api/shop/items/:id',
        createItem: 'POST /api/shop/items',
        updateItem: 'PUT /api/shop/items/:id',
        deleteItem: 'DELETE /api/shop/items/:id'
      },
      redemptions: {
        list: 'GET /api/redemptions',
        create: 'POST /api/redemptions',
        process: 'PUT /api/redemptions/:id',
        pendingCount: 'GET /api/redemptions/pending/count'
      },
      badges: {
        templates: 'GET /api/badges/templates',
        userBadges: 'GET /api/badges/user/:userId',
        createTemplate: 'POST /api/badges/templates',
        deleteTemplate: 'DELETE /api/badges/templates/:id',
        award: 'POST /api/badges/award',
        checkAndAward: 'POST /api/badges/check-and-award/:userId'
      },
      family: {
        info: 'GET /api/family/info',
        updateInfo: 'PUT /api/family/info',
        stats: 'GET /api/family/stats',
        myChildren: 'GET /api/family/my-children',
        myParents: 'GET /api/family/my-parents',
        addChild: 'POST /api/family/add-child',
        removeChild: 'DELETE /api/family/remove-child',
        updateRelation: 'PUT /api/family/update-relation',
        uploadPhoto: 'POST /api/family/upload-photo',
        deletePhoto: 'DELETE /api/family/photo',
        customTextTemplates: 'GET /api/family/custom-texts/templates',
        updateCustomText: 'PUT /api/family/custom-texts/:key'
      }
    },
    testAccounts: {
      parent: { username: 'parent', password: 'parent123' },
      child: { username: 'xiaoming', password: 'child123' }
    }
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '服务器运行正常' });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: '请求的资源不存在' });
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: '服务器内部错误' });
});

// 导出Socket服务器实例，供其他模块使用
// Serverless 环境下返回 null
let _socketServer: SocketServer | null = null;

export const getSocketServer = (): SocketServer | null => _socketServer;

// 只在非 Serverless 环境下启动服务器
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  _socketServer = new SocketServer(server);
  server.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📝 环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Socket.io 服务器已启动`);
  });
}

export default app;
