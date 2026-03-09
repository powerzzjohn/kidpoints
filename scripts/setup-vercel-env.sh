#!/bin/bash

# Vercel 环境变量设置助手

echo "🔧 Vercel 环境变量设置助手"
echo "================================"
echo ""

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装"
    echo "📦 正在安装 Vercel CLI..."
    npm install -g vercel
fi

# 登录检查
echo "🔐 检查 Vercel 登录状态..."
vercel whoami || vercel login

echo ""
echo "📝 请提供以下环境变量："
echo ""

# DATABASE_URL
read -p "Supabase 数据库连接字符串 (DATABASE_URL): " DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL 不能为空"
    exit 1
fi

# JWT_SECRET
echo ""
echo "生成 JWT 密钥..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "✅ 已生成 JWT_SECRET: ${JWT_SECRET:0:20}..."

# CORS_ORIGIN
echo ""
read -p "前端域名 (CORS_ORIGIN, 例如: https://your-app.vercel.app): " CORS_ORIGIN
if [ -z "$CORS_ORIGIN" ]; then
    echo "⚠️  CORS_ORIGIN 为空，将使用 * (不推荐用于生产环境)"
    CORS_ORIGIN="*"
fi

# NODE_ENV
NODE_ENV="production"

# 可选的 Supabase Storage 配置
echo ""
read -p "是否配置 Supabase Storage（用于文件上传）？(y/n): " SETUP_STORAGE
if [[ $SETUP_STORAGE =~ ^[Yy]$ ]]; then
    read -p "Supabase 项目 URL (SUPABASE_URL): " SUPABASE_URL
    read -p "Supabase Anon Key (SUPABASE_ANON_KEY): " SUPABASE_ANON_KEY
    read -p "Supabase Service Key (SUPABASE_SERVICE_KEY): " SUPABASE_SERVICE_KEY
fi

echo ""
echo "🚀 正在设置 Vercel 环境变量..."
echo ""

# 设置环境变量
vercel env add DATABASE_URL production <<< "$DATABASE_URL"
vercel env add JWT_SECRET production <<< "$JWT_SECRET"
vercel env add CORS_ORIGIN production <<< "$CORS_ORIGIN"
vercel env add NODE_ENV production <<< "$NODE_ENV"

if [[ $SETUP_STORAGE =~ ^[Yy]$ ]]; then
    vercel env add SUPABASE_URL production <<< "$SUPABASE_URL"
    vercel env add SUPABASE_ANON_KEY production <<< "$SUPABASE_ANON_KEY"
    vercel env add SUPABASE_SERVICE_KEY production <<< "$SUPABASE_SERVICE_KEY"
fi

echo ""
echo "✅ 环境变量设置完成！"
echo ""
echo "📋 已设置的环境变量："
echo "  - DATABASE_URL"
echo "  - JWT_SECRET"
echo "  - CORS_ORIGIN"
echo "  - NODE_ENV"
if [[ $SETUP_STORAGE =~ ^[Yy]$ ]]; then
    echo "  - SUPABASE_URL"
    echo "  - SUPABASE_ANON_KEY"
    echo "  - SUPABASE_SERVICE_KEY"
fi

echo ""
echo "🎯 下一步："
echo "1. 运行数据库迁移: ./scripts/migrate-to-postgres.sh"
echo "2. 部署到 Vercel: vercel --prod"
echo ""