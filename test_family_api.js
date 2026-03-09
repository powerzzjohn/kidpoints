// 测试family API的简单脚本
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testFamilyAPI() {
  console.log('=== 测试Family API ===\n');

  try {
    // 1. 登录家长账户
    console.log('1. 登录家长账户...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      username: 'parent',
      password: 'parent123'
    });
    
    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('登录成功，token获取成功\n');

    // 2. 测试获取家庭信息
    console.log('2. 测试获取家庭信息...');
    try {
      const familyInfoRes = await axios.get(`${API_BASE}/family/info`, { headers });
      console.log('家庭信息:', JSON.stringify(familyInfoRes.data, null, 2));
    } catch (error) {
      console.log('获取家庭信息失败:', error.response?.data || error.message);
    }
    console.log();

    // 3. 测试获取家庭统计信息
    console.log('3. 测试获取家庭统计信息...');
    try {
      const statsRes = await axios.get(`${API_BASE}/family/stats`, { headers });
      console.log('家庭统计信息:', JSON.stringify(statsRes.data, null, 2));
    } catch (error) {
      console.log('获取家庭统计信息失败:', error.response?.data || error.message);
    }
    console.log();

    // 4. 测试获取我的孩子列表
    console.log('4. 测试获取我的孩子列表...');
    try {
      const childrenRes = await axios.get(`${API_BASE}/family/my-children`, { headers });
      console.log('我的孩子列表:', JSON.stringify(childrenRes.data, null, 2));
    } catch (error) {
      console.log('获取孩子列表失败:', error.response?.data || error.message);
    }
    console.log();

    // 5. 登录儿童账户测试获取家长列表
    console.log('5. 登录儿童账户测试获取家长列表...');
    const childLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      username: 'xiaoming',
      password: 'child123'
    });
    
    const childToken = childLoginRes.data.token;
    const childHeaders = { Authorization: `Bearer ${childToken}` };
    
    try {
      const parentsRes = await axios.get(`${API_BASE}/family/my-parents`, { headers: childHeaders });
      console.log('我的家长列表:', JSON.stringify(parentsRes.data, null, 2));
    } catch (error) {
      console.log('获取家长列表失败:', error.response?.data || error.message);
    }
    console.log();

    console.log('=== 测试完成 ===');

  } catch (error) {
    console.error('测试过程中出现错误:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  console.log('注意：请确保服务器正在运行 (npm run dev)');
  console.log('按 Ctrl+C 退出\n');
  testFamilyAPI();
}

module.exports = { testFamilyAPI };