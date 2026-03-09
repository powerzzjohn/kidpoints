#!/bin/bash

# 儿童积分系统 - Vercel 部署脚本

echo "🚀 开始部署到 Vercel..."

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装"
    echo "📦 正在安装 Vercel CLI..."
    npm install -g vercel
fi

# 检查是否已登录
echo "🔐 检查 Vercel 登录状态..."
vercel whoami || vercel login

# 构建项目
echo "🔨 构建项目..."
npm run build

# 部署到 Vercel
echo "🌐 部署到 Vercel..."
vercel --prod

echo "✅ 部署完成！"
echo "📝 请记得在 Vercel Dashboard 中配置环境变量"
echo "🔗 访问 https://vercel.com/dashboard 查看部署状态"