# 部署指南：Vercel + Supabase

## 架构说明

```
用户浏览器
    ↓
Vercel（前端静态文件 + API Serverless Functions）
    ↓
Supabase（PostgreSQL 数据库）
```

- 前端 React → Vercel 静态托管
- 后端 Express API → Vercel Serverless Functions（`api/index.ts`）
- 数据库 → Supabase PostgreSQL

---

## 第一步：创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com) → New Project
2. 填写项目名称，设置数据库密码（记住它）
3. 等待项目创建完成（约1分钟）
4. 进入 **Settings → Database → Connection string**
5. 复制两个 URL：
   - **Transaction**（端口 6543）→ 用作 `DATABASE_URL`
   - **Session**（端口 5432）→ 用作 `DIRECT_URL`

---

## 第二步：初始化数据库

在本地执行（替换为你的实际连接字符串）：

```bash
# 设置环境变量
export DATABASE_URL="postgresql://postgres.xxx:密码@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
export DIRECT_URL="postgresql://postgres.xxx:密码@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# 运行迁移（创建所有表）
npx prisma migrate deploy --schema=server/prisma/schema.prisma

# 填充初始数据（测试账户等）
cd server && npm run db:seed
```

---

## 第三步：推送代码到 GitHub

```bash
git add .
git commit -m "ready for deployment"
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

---

## 第四步：部署到 Vercel

1. 访问 [vercel.com](https://vercel.com) → Add New Project
2. 选择你的 GitHub 仓库 → Import
3. **不需要修改任何构建设置**（`vercel.json` 已配置好）
4. 在 **Environment Variables** 中添加：

| 变量名 | 值 |
|--------|-----|
| `DATABASE_URL` | Supabase Transaction URL（端口 6543） |
| `DIRECT_URL` | Supabase Session URL（端口 5432） |
| `JWT_SECRET` | 运行 `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` 生成 |
| `CORS_ORIGIN` | 先填 `*`，部署后改为实际域名 |
| `NODE_ENV` | `production` |

5. 点击 **Deploy**，等待约2分钟

---

## 第五步：更新 CORS_ORIGIN

部署完成后：
1. 复制 Vercel 给你的域名（如 `https://kidpoints.vercel.app`）
2. 在 Vercel → Settings → Environment Variables 中
3. 将 `CORS_ORIGIN` 改为实际域名
4. 点击 **Redeploy**

---

## 验证部署

访问 `https://你的域名.vercel.app/api/health`，应该返回：
```json
{ "status": "ok", "timestamp": "..." }
```

然后访问前端，用测试账户登录：
- 家长：`parent` / `parent123`
- 儿童：`xiaoming` / `child123`

---

## 本地开发连接 Supabase

如果想本地也用 Supabase 数据库（推荐，保持一致）：

```bash
# 复制 .env 模板
cp server/.env.example server/.env

# 填入你的 Supabase 连接信息
# 然后启动
npm run dev:server
```

---

## 常见问题

**Q: 部署后 API 返回 500**  
A: 检查 `DATABASE_URL` 是否正确，在 Vercel Functions 日志中查看具体错误

**Q: 登录后跳转失败**  
A: 检查 `CORS_ORIGIN` 是否设置为正确的前端域名

**Q: 实时通知不工作**  
A: Vercel Serverless 不支持 WebSocket，通知功能降级为 HTTP 轮询，延迟约1-2秒，属正常现象

**Q: 文件上传失败**  
A: Serverless 环境没有持久化文件系统，需要配置 Supabase Storage（见下方扩展）

---

## 扩展：配置 Supabase Storage（文件上传）

如需支持家庭照片上传：

1. Supabase Dashboard → Storage → New Bucket
2. 名称：`family-photos`，设为 Public
3. 在 Vercel 环境变量中添加：
   - `SUPABASE_URL` = `https://项目ID.supabase.co`
   - `SUPABASE_SERVICE_KEY` = Settings → API → service_role key
