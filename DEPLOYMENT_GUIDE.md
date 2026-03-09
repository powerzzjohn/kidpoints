# 🚀 Vercel + Supabase 部署指南

本指南将帮助你将儿童积分管理系统部署到 Vercel 和 Supabase。

## 📋 前置准备

### 需要的账户
1. [Vercel 账户](https://vercel.com) - 免费
2. [Supabase 账户](https://supabase.com) - 免费
3. [GitHub 账户](https://github.com) - 免费（用于代码托管）

### 本地环境
- Node.js 18+ 
- npm 或 yarn
- Git

## 🗄️ 第一步：设置 Supabase 数据库

### 1.1 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: `children-points-system`
   - **Database Password**: 设置一个强密码（保存好！）
   - **Region**: 选择离你最近的区域
4. 点击 "Create new project"
5. 等待项目创建完成（约2分钟）

### 1.2 获取数据库连接信息

1. 在项目 Dashboard，点击左侧 "Settings" → "Database"
2. 找到 "Connection string" 部分
3. 选择 "URI" 模式
4. 复制连接字符串，格式如下：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
5. 将 `[YOUR-PASSWORD]` 替换为你设置的数据库密码

### 1.3 配置数据库

在 Supabase SQL Editor 中执行以下命令（可选，Prisma 会自动创建表）：

```sql
-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 启用 pgcrypto 扩展（用于密码加密）
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## 📦 第二步：准备代码仓库

### 2.1 初始化 Git 仓库（如果还没有）

```bash
git init
git add .
git commit -m "Initial commit: Children Points System"
```

### 2.2 推送到 GitHub

1. 在 GitHub 创建新仓库
2. 推送代码：

```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git branch -M main
git push -u origin main
```

### 2.3 更新 .gitignore

确保以下文件被忽略：

```
# 环境变量
.env
.env.local
.env.production

# 数据库
*.db
*.db-journal

# 依赖
node_modules/

# 构建输出
dist/
build/

# 日志
*.log

# 上传文件
uploads/
```

## 🌐 第三步：部署到 Vercel

### 3.1 导入项目到 Vercel

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New..." → "Project"
3. 选择你的 GitHub 仓库
4. 点击 "Import"

### 3.2 配置项目设置

在 "Configure Project" 页面：

**Framework Preset**: 选择 "Other"

**Root Directory**: 保持为 `.` (根目录)

**Build Command**: 
```bash
npm run vercel-build
```

**Output Directory**: 
```bash
client/dist
```

**Install Command**: 
```bash
npm install
```

### 3.3 配置环境变量

在 "Environment Variables" 部分，添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://postgres:...` | Supabase 数据库连接字符串 |
| `JWT_SECRET` | `your-secret-key` | JWT 密钥（生成一个强密码） |
| `CORS_ORIGIN` | `https://your-app.vercel.app` | 你的 Vercel 域名 |
| `NODE_ENV` | `production` | 环境标识 |

**生成 JWT_SECRET 的方法：**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.4 部署

1. 点击 "Deploy"
2. 等待部署完成（约2-3分钟）
3. 部署成功后，你会看到项目 URL

## 🗃️ 第四步：运行数据库迁移

### 4.1 本地运行迁移

在本地环境，使用 Supabase 数据库 URL：

```bash
# 设置环境变量
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# 运行迁移
cd server
npx prisma migrate deploy

# 生成 Prisma Client
npx prisma generate
```

### 4.2 填充初始数据（可选）

```bash
# 运行种子脚本
npm run db:seed
```

这将创建：
- 示例家庭
- 测试账户（parent/parent123, xiaoming/child123）
- 示例规则和商品

## 🔧 第五步：配置前端环境

### 5.1 更新客户端 API 地址

在 Vercel 项目设置中，添加前端环境变量：

| 变量名 | 值 |
|--------|-----|
| `VITE_API_URL` | `https://your-app.vercel.app/api` |
| `VITE_SOCKET_URL` | `https://your-app.vercel.app` |

### 5.2 更新客户端代码

编辑 `client/src/lib/api.ts`：

```typescript
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

编辑 `client/src/lib/socket.ts`：

```typescript
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
```

### 5.3 重新部署

```bash
git add .
git commit -m "Update API URLs for production"
git push
```

Vercel 会自动重新部署。

## 📁 第六步：配置文件上传（可选）

### 6.1 使用 Supabase Storage

1. 在 Supabase Dashboard，点击 "Storage"
2. 创建新 Bucket：
   - **Name**: `family-photos`
   - **Public**: 选择 "Public bucket"
3. 点击 "Create bucket"

### 6.2 获取 Supabase 密钥

1. 在 Supabase Dashboard，点击 "Settings" → "API"
2. 复制以下信息：
   - **Project URL**: `https://[YOUR-PROJECT-REF].supabase.co`
   - **anon public key**: 公开密钥
   - **service_role key**: 服务密钥（保密！）

### 6.3 更新环境变量

在 Vercel 项目设置中添加：

| 变量名 | 值 |
|--------|-----|
| `SUPABASE_URL` | `https://[YOUR-PROJECT-REF].supabase.co` |
| `SUPABASE_ANON_KEY` | 你的 anon key |
| `SUPABASE_SERVICE_KEY` | 你的 service key |

### 6.4 更新上传代码

编辑 `server/src/utils/upload.ts` 使用 Supabase Storage 而不是本地文件系统。

## ✅ 第七步：验证部署

### 7.1 测试网站

1. 访问你的 Vercel URL
2. 尝试登录测试账户：
   - 用户名: `parent`
   - 密码: `parent123`

### 7.2 测试功能

- ✅ 用户登录
- ✅ 创建规则
- ✅ 添加积分
- ✅ 创建商品
- ✅ 申请兑换
- ✅ 实时通知
- ✅ 排行榜

### 7.3 检查日志

在 Vercel Dashboard：
1. 选择你的项目
2. 点击 "Deployments"
3. 点击最新部署
4. 查看 "Functions" 日志

## 🔒 第八步：安全配置

### 8.1 更新 CORS 设置

确保服务器只接受来自你域名的请求。

编辑 `server/src/index.ts`：

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

### 8.2 启用 HTTPS

Vercel 自动提供 HTTPS，无需额外配置。

### 8.3 设置自定义域名（可选）

1. 在 Vercel Dashboard，选择项目
2. 点击 "Settings" → "Domains"
3. 添加你的自定义域名
4. 按照说明配置 DNS

## 📊 第九步：监控和维护

### 9.1 Vercel Analytics

1. 在 Vercel Dashboard，点击 "Analytics"
2. 查看访问量、性能指标

### 9.2 Supabase 监控

1. 在 Supabase Dashboard，点击 "Database" → "Logs"
2. 查看数据库查询日志

### 9.3 错误追踪

考虑集成错误追踪服务：
- [Sentry](https://sentry.io)
- [LogRocket](https://logrocket.com)

## 🔄 第十步：持续部署

### 10.1 自动部署

Vercel 已配置自动部署：
- 推送到 `main` 分支 → 自动部署到生产环境
- 推送到其他分支 → 创建预览部署

### 10.2 回滚

如果部署出现问题：
1. 在 Vercel Dashboard，点击 "Deployments"
2. 找到之前的成功部署
3. 点击 "..." → "Promote to Production"

## 🎯 性能优化建议

### 数据库优化
1. 在 Supabase 中创建适当的索引
2. 使用连接池
3. 启用查询缓存

### 前端优化
1. 启用 Vercel Edge Network
2. 配置图片优化
3. 使用代码分割

### Socket.io 优化
1. 使用 Vercel Serverless Functions 的 WebSocket 支持
2. 考虑使用 Redis 作为 Socket.io 适配器（多实例场景）

## 🐛 常见问题

### 问题 1: 数据库连接失败

**解决方案:**
- 检查 `DATABASE_URL` 是否正确
- 确保 Supabase 项目正在运行
- 检查 IP 白名单设置

### 问题 2: Socket.io 连接失败

**解决方案:**
- Vercel Serverless Functions 对 WebSocket 支持有限
- 考虑使用 Vercel Edge Functions
- 或使用独立的 Socket.io 服务器（如 Railway、Render）

### 问题 3: 文件上传失败

**解决方案:**
- 使用 Supabase Storage 而不是本地文件系统
- 配置正确的 CORS 设置
- 检查文件大小限制

### 问题 4: 环境变量未生效

**解决方案:**
- 在 Vercel 中重新部署
- 检查变量名是否正确
- 确保变量在正确的环境中设置

## 📚 相关资源

- [Vercel 文档](https://vercel.com/docs)
- [Supabase 文档](https://supabase.com/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [Socket.io 文档](https://socket.io/docs)

## 🎉 完成！

恭喜！你的儿童积分管理系统现在已经部署到云端了！

**下一步:**
1. 创建真实的家庭账户
2. 邀请家庭成员使用
3. 根据反馈持续改进

## 💡 生产环境建议

### 必做事项
- ✅ 更改所有默认密码
- ✅ 设置强 JWT 密钥
- ✅ 配置备份策略
- ✅ 启用 SSL/HTTPS
- ✅ 设置错误监控

### 推荐事项
- 📧 配置邮件通知
- 📱 添加移动端适配
- 🔔 配置浏览器推送通知
- 📊 添加数据分析
- 🌍 支持多语言

## 🆘 需要帮助？

如果遇到问题：
1. 查看 Vercel 部署日志
2. 检查 Supabase 数据库日志
3. 查看浏览器控制台错误
4. 参考本指南的常见问题部分

祝部署顺利！🚀