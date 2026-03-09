#!/bin/bash

# 数据库迁移脚本：从 SQLite 迁移到 PostgreSQL

echo "🗄️ 开始数据库迁移..."

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 错误: DATABASE_URL 环境变量未设置"
    echo "请设置 Supabase PostgreSQL 连接字符串:"
    echo "export DATABASE_URL='postgresql://postgres:password@db.xxx.supabase.co:5432/postgres'"
    exit 1
fi

echo "✅ 数据库连接字符串已设置"

# 进入服务器目录
cd server

# 生成 Prisma Client
echo "📦 生成 Prisma Client..."
npx prisma generate

# 运行迁移
echo "🔄 运行数据库迁移..."
npx prisma migrate deploy

# 检查迁移状态
if [ $? -eq 0 ]; then
    echo "✅ 数据库迁移成功！"
    
    # 询问是否填充初始数据
    read -p "是否填充初始数据？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🌱 填充初始数据..."
        npm run db:seed
        echo "✅ 初始数据填充完成！"
    fi
else
    echo "❌ 数据库迁移失败"
    exit 1
fi

echo "🎉 迁移完成！"
echo "📊 你可以使用以下命令查看数据库:"
echo "cd server && npx prisma studio"