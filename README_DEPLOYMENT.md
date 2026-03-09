# 🚀 儿童积分管理系统 - 部署版本

## 📦 项目概述

这是一个完整的家庭儿童积分管理系统，现已准备好部署到 Vercel + Supabase。

### 技术栈
- **前端**: React + TypeScript + Tailwind CSS
- **后端**: Express.js + TypeScript
- **数据库**: PostgreSQL (Supabase)
- **部署**: Vercel
- **实时通信**: Socket.io

## 🎯 核心功能

✅ 用户认证系统  
✅ 行为规则管理  
✅ 积分系统  
✅ 积分商城  
✅ 礼品兑换  
✅ 成就勋章  
✅ 主题系统  
✅ 实时通知  
✅ 积分排行榜  
✅ 家庭管理  

## 📚 部署文档

### 快速开始
- [5分钟快速部署](./QUICK_DEPLOY.md) - 最快的部署方式
- [完整部署指南](./DEPLOYMENT_GUIDE.md) - 详细的步骤说明
- [部署检查清单](./DEPLOYMENT_CHECKLIST.md) - 确保不遗漏任何步骤

### 配置文件
- `vercel.json` - Vercel 部署配置
- `.env.production.example` - 生产环境变量模板
- `server/prisma/schema.prisma` - 数据库模型（已更新为 PostgreSQL）

### 脚本工具
- `scripts/deploy.sh` - 一键部署脚本
- `scripts/migrate-to-postgres.sh` - 数据库迁移脚本
- `scripts/check-env.js` - 环境变量检查脚本

## 🚀 快速部署步骤

### 1. 创建 Supabase 项目
```bash
# 访问 https://supabase.com
# 创建新项目并获取数据库连接字符串
```

### 2. 推送代码到 GitHub
```bash
git init
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 3. 部署到 Vercel
```bash
# 访问 https://vercel.com
# 导入 GitHub 仓库
# 配置环境变量
# 点击部署
```

### 4. 运行数据库迁移
```bash
export DATABASE_URL="your-supabase-connection-string"
cd server
npx prisma migrate deploy
npm run db:seed
```

## 🔧 必需的环境变量

```bash
# Supabase 数据库
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# JWT 密钥（生成一个强密码）
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters"

# CORS 源（你的 Vercel 域名）
CORS_ORIGIN="https://your-app.vercel.app"

# 环境标识
NODE_ENV="production"
```

## 📊 项目结构

```
.
├── client/                 # 前端 React 应用
│   ├── src/
│   │   ├── components/    # UI 组件
│   │   ├── pages/         # 页面组件
│   │   ├── lib/           # 工具库
│   │   └── store/         # 状态管理
│   └── dist/              # 构建输出
├── server/                # 后端 Express 应用
│   ├── src/
│   │   ├── routes/        # API 路由
│   │   ├── middleware/    # 中间件
│   │   ├── utils/         # 工具函数
│   │   └── socket/        # Socket.io 服务
│   └── prisma/            # 数据库模型和迁移
├── api/                   # Vercel Serverless Functions
├── scripts/               # 部署和维护脚本
├── vercel.json           # Vercel 配置
└── README_DEPLOYMENT.md  # 本文件
```

## 🧪 测试账户

部署后可以使用以下测试账户：

**家长账户:**
- 用户名: `parent`
- 密码: `parent123`

**儿童账户:**
- 用户名: `xiaoming`
- 密码: `child123`

⚠️ **重要**: 在生产环境中，请更改这些默认密码或删除测试账户。

## 📱 功能演示

### 家长端
- 创建和管理行为规则
- 为儿童添加/扣除积分
- 管理积分商城
- 审批兑换申请
- 颁发勋章
- 查看排行榜

### 儿童端
- 确认行为规则
- 查看积分余额和历史
- 浏览商城并申请兑换
- 查看我的勋章
- 查看排行榜

## 🔔 实时通知

系统支持以下实时通知：
- 💰 积分变化通知
- 🎁 兑换申请通知
- ✅ 兑换处理通知
- 📝 规则确认通知
- 🏆 勋章获得通知
- 📸 家庭照片更新通知
- ✏️ 自定义文本更新通知
- 💬 实时消息通知

## 🏆 排行榜功能

- 多时间段排名（总榜/周榜/月榜）
- 详细统计信息
- 排名奖牌显示
- 鼓励机制

## 🎨 主题系统

- 植物大战僵尸主题
- 我的世界主题
- 一键切换
- 持久化保存

## 🔒 安全特性

- JWT 认证
- 密码加密
- 角色权限控制
- 家庭数据隔离
- CORS 保护
- 输入验证

## 📈 性能优化

- 代码分割
- 懒加载
- CDN 加速（Vercel）
- 数据库索引
- 连接池管理

## 🐛 故障排除

### 数据库连接失败
检查 `DATABASE_URL` 是否正确，确保 Supabase 项目正在运行。

### 部署失败
查看 Vercel 部署日志，通常是环境变量未设置或构建错误。

### Socket.io 不工作
Vercel Serverless 对 WebSocket 支持有限，考虑使用轮询模式。

### 文件上传失败
配置 Supabase Storage 并设置相关环境变量。

## 📞 获取帮助

- [完整部署指南](./DEPLOYMENT_GUIDE.md)
- [功能总结](./FEATURES_SUMMARY.md)
- [测试指南](./TESTING_GUIDE.md)
- [实时通知测试](./REAL_TIME_NOTIFICATION_TEST.md)

## 🔄 更新和维护

### 更新代码
```bash
git pull origin main
git add .
git commit -m "Update features"
git push origin main
# Vercel 会自动重新部署
```

### 数据库迁移
```bash
cd server
npx prisma migrate dev --name your_migration_name
npx prisma migrate deploy  # 生产环境
```

### 回滚部署
在 Vercel Dashboard 中选择之前的部署并提升为生产环境。

## 📊 监控

### Vercel Analytics
- 访问量统计
- 性能指标
- 错误追踪

### Supabase Dashboard
- 数据库性能
- 查询日志
- 存储使用情况

## 🎯 下一步

1. ✅ 完成部署
2. ✅ 测试所有功能
3. ✅ 配置自定义域名
4. ✅ 设置监控和告警
5. ✅ 准备用户文档
6. ✅ 收集用户反馈
7. ✅ 持续优化改进

## 📝 许可证

MIT License

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

## 🎉 致谢

感谢使用儿童积分管理系统！

---

**准备好了吗？** 开始部署吧！🚀

查看 [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) 开始5分钟快速部署。