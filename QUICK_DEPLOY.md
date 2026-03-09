# 🚀 快速部署指南

5分钟内将你的儿童积分系统部署到云端！

## 📋 准备工作（5分钟）

### 1. 创建 Supabase 项目
1. 访问 https://supabase.com
2. 点击 "New Project"
3. 设置项目名称和密码
4. 等待项目创建完成

### 2. 获取数据库连接字符串
1. 在 Supabase Dashboard，点击 "Settings" → "Database"
2. 复制 "Connection string" (URI 模式)
3. 替换 `[YOUR-PASSWORD]` 为你的密码

示例：
```
postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres
```

### 3. 推送代码到 GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

## 🌐 部署到 Vercel（3分钟）

### 1. 导入项目
1. 访问 https://vercel.com
2. 点击 "Add New..." → "Project"
3. 选择你的 GitHub 仓库
4. 点击 "Import"

### 2. 配置环境变量

在 "Environment Variables" 部分添加：

```bash
# 数据库连接（必需）
DATABASE_URL=postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres

# JWT 密钥（必需）- 生成一个随机字符串
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# CORS 源（必需）- 先用 * 测试，部署后改为实际域名
CORS_ORIGIN=*

# 环境标识（必需）
NODE_ENV=production
```

**生成 JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. 部署
1. 点击 "Deploy"
2. 等待2-3分钟
3. 部署完成！

## 🗄️ 初始化数据库（2分钟）

### 方法 1: 本地运行迁移（推荐）

```bash
# 设置环境变量
export DATABASE_URL="postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres"

# 运行迁移
cd server
npx prisma migrate deploy

# 填充初始数据
npm run db:seed
```

### 方法 2: 使用脚本

```bash
# 给脚本执行权限
chmod +x scripts/migrate-to-postgres.sh

# 运行迁移脚本
DATABASE_URL="your-connection-string" ./scripts/migrate-to-postgres.sh
```

## ✅ 验证部署

1. 访问你的 Vercel URL（例如：`https://your-app.vercel.app`）
2. 使用测试账户登录：
   - 用户名: `parent`
   - 密码: `parent123`
3. 测试功能是否正常

## 🔧 常见问题

### 问题：数据库连接失败
**解决：** 检查 `DATABASE_URL` 是否正确，密码是否包含特殊字符需要编码

### 问题：部署失败
**解决：** 查看 Vercel 部署日志，通常是环境变量未设置

### 问题：Socket.io 不工作
**解决：** Vercel Serverless 对 WebSocket 支持有限，考虑使用轮询模式或独立 Socket 服务器

## 🎯 下一步

1. **更新 CORS_ORIGIN**
   - 在 Vercel Dashboard 中，将 `CORS_ORIGIN` 改为你的实际域名
   - 例如：`https://your-app.vercel.app`

2. **配置自定义域名**
   - 在 Vercel Dashboard → Settings → Domains
   - 添加你的域名并配置 DNS

3. **启用文件上传**
   - 配置 Supabase Storage
   - 添加 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 环境变量

4. **监控和优化**
   - 查看 Vercel Analytics
   - 监控 Supabase 数据库性能

## 📚 详细文档

需要更详细的说明？查看：
- [完整部署指南](./DEPLOYMENT_GUIDE.md)
- [功能总结](./FEATURES_SUMMARY.md)
- [测试指南](./TESTING_GUIDE.md)

## 🆘 需要帮助？

1. 检查 Vercel 部署日志
2. 查看 Supabase 数据库日志
3. 参考 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 的常见问题部分

## 🎉 完成！

恭喜！你的儿童积分系统现在已经在云端运行了！

**测试账户：**
- 家长: `parent` / `parent123`
- 儿童: `xiaoming` / `child123`

**重要提示：**
- 记得更改默认密码
- 设置强 JWT 密钥
- 配置正确的 CORS 源
- 定期备份数据库

祝使用愉快！🎊