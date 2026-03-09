#!/usr/bin/env node

// 部署后健康检查脚本

const axios = require('axios');

const BASE_URL = process.argv[2] || 'http://localhost:3001';

console.log('🏥 开始健康检查...');
console.log(`🔗 目标: ${BASE_URL}\n`);

const tests = [
  {
    name: '根路径',
    url: '/',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: '健康检查端点',
    url: '/health',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'API 文档',
    url: '/api',
    method: 'GET',
    expectedStatus: 404 // 没有 /api 路由，应该返回 404
  },
  {
    name: '登录端点',
    url: '/api/auth/login',
    method: 'POST',
    data: { username: 'test', password: 'test' },
    expectedStatus: [401, 404] // 可能是认证失败或用户不存在
  }
];

async function runHealthCheck() {
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const config = {
        method: test.method,
        url: `${BASE_URL}${test.url}`,
        validateStatus: () => true, // 不抛出错误
        timeout: 10000
      };

      if (test.data) {
        config.data = test.data;
        config.headers = { 'Content-Type': 'application/json' };
      }

      const response = await axios(config);
      
      const expectedStatuses = Array.isArray(test.expectedStatus) 
        ? test.expectedStatus 
        : [test.expectedStatus];
      
      const isSuccess = expectedStatuses.includes(response.status);

      if (isSuccess) {
        console.log(`✅ ${test.name}: ${response.status}`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: 期望 ${expectedStatuses.join('/')}, 实际 ${response.status}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 测试结果: ${passed} 通过, ${failed} 失败`);
  
  if (failed === 0) {
    console.log('✅ 所有健康检查通过！');
    process.exit(0);
  } else {
    console.log('❌ 部分健康检查失败');
    process.exit(1);
  }
}

// 测试数据库连接
async function testDatabase() {
  console.log('\n🗄️  测试数据库连接...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'parent',
      password: 'parent123'
    });
    
    if (response.status === 200) {
      console.log('✅ 数据库连接正常（登录成功）');
      return true;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ 数据库连接正常（认证端点响应）');
      return true;
    }
    console.log('❌ 数据库连接可能有问题:', error.message);
    return false;
  }
}

// 运行检查
(async () => {
  try {
    await runHealthCheck();
    await testDatabase();
  } catch (error) {
    console.error('❌ 健康检查失败:', error.message);
    process.exit(1);
  }
})();