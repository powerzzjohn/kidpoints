#!/usr/bin/env node

// 环境变量检查脚本

const requiredEnvVars = {
  production: [
    'DATABASE_URL',
    'JWT_SECRET',
    'CORS_ORIGIN',
    'NODE_ENV'
  ],
  optional: [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY'
  ]
};

console.log('🔍 检查环境变量配置...\n');

let hasErrors = false;
let hasWarnings = false;

// 检查必需的环境变量
console.log('📋 必需的环境变量:');
requiredEnvVars.production.forEach(varName => {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName}: 已设置`);
  } else {
    console.log(`  ❌ ${varName}: 未设置`);
    hasErrors = true;
  }
});

// 检查可选的环境变量
console.log('\n📋 可选的环境变量:');
requiredEnvVars.optional.forEach(varName => {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName}: 已设置`);
  } else {
    console.log(`  ⚠️  ${varName}: 未设置（文件上传功能可能不可用）`);
    hasWarnings = true;
  }
});

// 验证 DATABASE_URL 格式
if (process.env.DATABASE_URL) {
  console.log('\n🔗 验证数据库连接字符串...');
  if (process.env.DATABASE_URL.startsWith('postgresql://')) {
    console.log('  ✅ PostgreSQL 连接字符串格式正确');
  } else if (process.env.DATABASE_URL.startsWith('file:')) {
    console.log('  ⚠️  使用 SQLite（仅适用于开发环境）');
    hasWarnings = true;
  } else {
    console.log('  ❌ 数据库连接字符串格式不正确');
    hasErrors = true;
  }
}

// 验证 JWT_SECRET 强度
if (process.env.JWT_SECRET) {
  console.log('\n🔐 验证 JWT 密钥强度...');
  if (process.env.JWT_SECRET.length < 32) {
    console.log('  ⚠️  JWT 密钥太短（建议至少32个字符）');
    hasWarnings = true;
  } else {
    console.log('  ✅ JWT 密钥强度足够');
  }
}

// 验证 CORS_ORIGIN
if (process.env.CORS_ORIGIN) {
  console.log('\n🌐 验证 CORS 配置...');
  if (process.env.CORS_ORIGIN.startsWith('http://localhost')) {
    console.log('  ⚠️  CORS 设置为 localhost（仅适用于开发环境）');
    hasWarnings = true;
  } else if (process.env.CORS_ORIGIN.startsWith('https://')) {
    console.log('  ✅ CORS 配置正确');
  } else {
    console.log('  ❌ CORS 配置格式不正确');
    hasErrors = true;
  }
}

// 总结
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ 环境配置检查失败');
  console.log('请设置所有必需的环境变量后再部署');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  环境配置检查通过（有警告）');
  console.log('建议检查警告项以确保生产环境配置正确');
  process.exit(0);
} else {
  console.log('✅ 环境配置检查通过');
  console.log('所有必需的环境变量都已正确设置');
  process.exit(0);
}
