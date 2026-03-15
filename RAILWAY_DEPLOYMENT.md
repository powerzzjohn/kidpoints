# 🚂 Railway 部署指南

Railway 是一个对全栈应用非常友好的部署平台，支持我们的项目结构。

## 🎯 为什么选择 Railway？

- ✅ 原生支持 monorepo 结构
- ✅ 自动检测 Node.js 项目
- ✅ 免费额度：$5/月（足够小项目使用）
- ✅ 自动 HTTPS
- ✅ 简单的环境变量配置
- ✅ 与 GitHub 无缝集成

## 📋 部署步骤

### 1. 创建 Railway 账户
1. 访问 https://railway.app
2. 点击 "Start a New Project"
3. 使用 GitHub 账号登录

### 2. 部署项目
1. 点击 "Deploy from GitHub repo"
2. 选择 `powerzzjohn/kidpoints` 仓库
3. 点击 "Deploy Now"

### 3. 配置环境变量
在 Railway Dashboard 中添加以下环境变量：

```
DATABASE_URL=postgresql://postgres:你的密码@db.kbpgsoxqxuqusjcmytby.supabase.co:5432/postgres
JWT_SECRET=6d9181b8f6de9add7e147f1fd3989295e5fdcb49b12b75db45a151bc7e8db17b
CORS_ORIGIN=*
NODE_ENV=production
PORT=3001
```

### 4. 配置构建设置（如果需要）

Railway 通常会自动检测，但如果需要手动配置：

**Root Directory**: 留空（使用根目录）

**Build Command**:
```bash
cd server && npm install && npm run build
```

**Start Command**:
```bash
cd server && npm start
```

### 5. 添加 PostgreSQL 数据库（可选）

如果你想使用 Railway 的数据库而不是 Supabase：

1. 在项目中点击 "New"
2. 选择 "Database" → "PostgreSQL"
3. Railway 会自动设置 `DATABASE_URL`

### 6. 运行数据库迁移

部署成功后，在 Railway Dashboard 中：

1. 点击你的服务
2. 进入 "Settings" → "Deploy"  
3. 添加 "Deploy Command":
```bash
cd server && npx prisma migrate deploy && npm run db:seed
```

或者在本地运行：
```bash
export DATABASE_URL="你的数据库连接字符串"
cd server
npx prisma migrate deploy
npm run db:seed
```

## 🎉 完成！

部署完成后，Railway 会给你一个 URL，类似：
```
https://kidpoints-production.up.railway.app
```

## 📝 测试账户

- 家长: `parent` / `parent123`
- 儿童: `xiaoming` / `child123`

## 🔧 常见问题

### Q: 构建失败？
**A**: 检查构建日志，确保所有依赖都正确安装

### Q: 数据库连接失败？
**A**: 检查 `DATABASE_URL` 环境变量是否正确设置

### Q: 前端无法访问？
**A**: Railway 主要用于后端，前端建议单独部署到 Vercel 或 Netlify

## 🚀 前端部署（Netlify）

如果你想分离部署前端，可以使用 Netlify：

1. 访问 https://netlify.com
2. 导入 GitHub 仓库
3. 配置：
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`
4. 添加环境变量：
   - `VITE_API_URL`: Railway 后端 URL

## 📊 成本估算

- **Railway**: $5/月免费额度（通常够用）
- **Supabase**: 免费层（500MB 数据库）
- **Netlify**: 免费（100GB 带宽/月）

总计：**完全免费**（在免费额度内）

---

**推荐配置**: Railway (后端) + Netlify (前端) + Supabase (数据库)
