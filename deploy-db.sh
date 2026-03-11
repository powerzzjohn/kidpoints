#!/bin/bash

# 数据库部署脚本
# 使用方法: ./deploy-db.sh "你的数据库连接字符串"

if [ -z "$1" ]; then
    echo "❌ 错误: 请提供数据库连接字符串"
    echo "使用方法: ./deploy-db.sh \"postgresql://postgres:password@db.xxx.supabase.co:5432/postgres\""
    exit 1
fi

DATABASE_URL="$1"

echo "🗄️  开始数据库迁移..."
echo ""

# 设置环境变量
export DATABASE_URL="$DATABASE_URL"

# 进入服务器目录
cd server

echo "📦 安装依赖..."
npm install

echo ""
echo "🔄 生成 Prisma Client..."
npx prisma generate

echo ""
echo "🚀 运行数据库迁移..."
npx prisma migrate deploy

echo ""
echo "🌱 填充初始数据..."
npm run db:seed

echo ""
echo "✅ 数据库部署完成！"
echo ""
echo "📋 测试账户："
echo "  家长: parent / parent123"
echo "  儿童: xiaoming / child123"
echo ""
