# 儿童积分系统 (Children Points System)

一个游戏化的家庭积分管理平台，通过积分奖励机制鼓励儿童养成良好的行为习惯。

## 功能特点

- 🎮 **游戏化界面** - 支持植物大战僵尸和我的世界主题
- 👨‍👩‍👧‍👦 **双角色管理** - 家长管理端和儿童游戏端
- 🏆 **积分系统** - 自定义行为规则和积分奖励
- 🛒 **积分商城** - 实物和虚拟奖励兑换
- 🏅 **成就勋章** - 自动颁发和自定义勋章
- 🎨 **个性化定制** - 自定义文案和家庭照片
- 📱 **响应式设计** - 支持多设备访问

## 技术栈

### 前端
- React 18 + TypeScript
- Tailwind CSS + Framer Motion
- Zustand (状态管理)
- React Router (路由)

### 后端
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- JWT 认证
- Socket.io (实时通信)

## 快速开始

### 环境要求
- Node.js 18+
- PostgreSQL 14+
- npm 或 yarn

### 安装依赖
```bash
npm install
cd client && npm install
cd ../server && npm install
```

### 环境配置
1. 复制环境变量文件：
```bash
cp server/.env.example server/.env
```

2. 配置数据库连接和其他环境变量

### 数据库设置
```bash
# 运行数据库迁移
npm run db:migrate

# 填充种子数据
npm run db:seed
```

### 启动开发服务器
```bash
npm run dev
```

- 前端: http://localhost:3000
- 后端: http://localhost:5000
- 数据库管理: `npm run db:studio`

## 项目结构

```
children-points-system/
├── client/                 # React 前端应用
│   ├── src/
│   │   ├── components/     # 可复用组件
│   │   ├── pages/         # 页面组件
│   │   ├── hooks/         # 自定义 hooks
│   │   ├── stores/        # Zustand 状态管理
│   │   ├── themes/        # 主题配置
│   │   └── utils/         # 工具函数
├── server/                # Node.js 后端应用
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── middleware/    # 中间件
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # 路由
│   │   ├── services/      # 业务逻辑
│   │   └── utils/         # 工具函数
│   ├── prisma/           # 数据库模式和迁移
└── docs/                 # 项目文档
```

## 开发指南

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 ESLint 和 Prettier 配置
- 组件使用函数式组件和 hooks
- API 使用 RESTful 设计

### 测试
```bash
# 运行所有测试
npm test

# 运行前端测试
npm run test:client

# 运行后端测试
npm run test:server
```

## 部署

### 构建生产版本
```bash
npm run build
```

### 启动生产服务器
```bash
npm start
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。