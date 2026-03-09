#!/usr/bin/env node

const axios = require('axios');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001/api';
const TEST_ACCOUNTS = {
  parent: { username: 'parent', password: 'parent123' },
  child: { username: 'xiaoming', password: 'child123' }
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let authToken = '';
let currentUser = '';

// 颜色工具
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function color(text, colorName) {
  return colors[colorName] + text + colors.reset;
}

function printHeader(title) {
  console.log('\n' + color('='.repeat(50), 'cyan'));
  console.log(color(`  ${title}`, 'cyan'));
  console.log(color('='.repeat(50), 'cyan'));
}

function printSuccess(message) {
  console.log(color('✅ ' + message, 'green'));
}

function printError(message) {
  console.log(color('❌ ' + message, 'red'));
}

function printInfo(message) {
  console.log(color('ℹ️  ' + message, 'blue'));
}

function printWarning(message) {
  console.log(color('⚠️  ' + message, 'yellow'));
}

// 1. 登录功能
async function login() {
  printHeader('用户登录');
  
  console.log('请选择测试账户:');
  console.log('1. 家长账户 (parent / parent123)');
  console.log('2. 儿童账户 (xiaoming / child123)');
  
  return new Promise((resolve) => {
    rl.question('请选择 (1/2): ', async (choice) => {
      const account = choice === '2' ? TEST_ACCOUNTS.child : TEST_ACCOUNTS.parent;
      currentUser = choice === '2' ? 'child' : 'parent';
      
      try {
        printInfo(`正在登录 ${account.username}...`);
        const response = await axios.post(`${BASE_URL}/auth/login`, {
          username: account.username,
          password: account.password
        });
        
        authToken = response.data.token;
        printSuccess(`登录成功！欢迎 ${response.data.user.username} (${response.data.user.role})`);
        console.log(color(`Token: ${authToken.substring(0, 30)}...`, 'magenta'));
        resolve(true);
      } catch (error) {
        printError(`登录失败: ${error.response?.data?.message || error.message}`);
        resolve(false);
      }
    });
  });
}

// 2. 测试获取家庭信息
async function testGetFamilyInfo() {
  printHeader('测试获取家庭信息');
  
  try {
    const response = await axios.get(`${BASE_URL}/family/info`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    printSuccess('获取家庭信息成功！');
    console.log('\n家庭基本信息:');
    console.log(`- 家庭名称: ${response.data.name}`);
    console.log(`- 家庭描述: ${response.data.description || '无'}`);
    console.log(`- 家庭照片: ${response.data.photo || '未设置'}`);
    console.log(`- 创建时间: ${new Date(response.data.createdAt).toLocaleString()}`);
    console.log(`- 更新时间: ${new Date(response.data.updatedAt).toLocaleString()}`);
    
    console.log('\n自定义文本:');
    if (response.data.customTexts) {
      Object.entries(response.data.customTexts).forEach(([key, value]) => {
        console.log(`- ${key}: ${value}`);
      });
    } else {
      console.log('- 暂无自定义文本');
    }
    
    console.log('\n家庭成员:');
    response.data.users.forEach(user => {
      console.log(`- ${user.username} (${user.role}) - 主题: ${user.theme}`);
    });
    
    return true;
  } catch (error) {
    printError(`获取家庭信息失败: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 3. 测试获取自定义文本模板
async function testGetCustomTextTemplates() {
  printHeader('测试获取自定义文本模板');
  
  try {
    const response = await axios.get(`${BASE_URL}/family/custom-texts/templates`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    printSuccess('获取自定义文本模板成功！');
    console.log(`\n共有 ${Object.keys(response.data).length} 种可自定义文本:\n`);
    
    Object.entries(response.data).forEach(([key, template]) => {
      console.log(color(`${key}:`, 'yellow'));
      console.log(`  📝 ${template.label}`);
      console.log(`  📋 ${template.description}`);
      console.log(`  🔤 默认值: ${template.defaultValue}`);
      console.log(`  ✏️  占位符: ${template.placeholder}`);
      console.log('');
    });
    
    return true;
  } catch (error) {
    printError(`获取模板失败: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 4. 测试更新自定义文本
async function testUpdateCustomText() {
  printHeader('测试更新自定义文本');
  
  try {
    // 先获取当前的自定义文本
    const familyInfo = await axios.get(`${BASE_URL}/family/info`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const currentTexts = familyInfo.data.customTexts || {};
    const welcomeMessage = currentTexts.welcomeMessage || '欢迎来到我们的积分世界！';
    
    console.log(`当前欢迎消息: ${welcomeMessage}`);
    
    return new Promise((resolve) => {
      rl.question('\n请输入新的欢迎消息 (直接回车使用默认测试消息): ', async (newMessage) => {
        const testMessage = newMessage || `测试更新 - ${new Date().toLocaleTimeString()}`;
        
        try {
          const response = await axios.put(
            `${BASE_URL}/family/custom-texts/welcomeMessage`,
            { value: testMessage },
            {
              headers: { 
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          printSuccess('更新自定义文本成功！');
          console.log(`\n更新前: ${welcomeMessage}`);
          console.log(`更新后: ${response.data.customTexts.welcomeMessage}`);
          console.log(`更新时间: ${new Date(response.data.updatedAt).toLocaleString()}`);
          
          resolve(true);
        } catch (error) {
          printError(`更新失败: ${error.response?.data?.message || error.message}`);
          resolve(false);
        }
      });
    });
  } catch (error) {
    printError(`获取当前文本失败: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 5. 测试获取家庭统计信息
async function testGetFamilyStats() {
  printHeader('测试获取家庭统计信息');
  
  try {
    const response = await axios.get(`${BASE_URL}/family/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    printSuccess('获取家庭统计信息成功！');
    
    const stats = response.data;
    console.log('\n👨‍👩‍👧‍👦 家庭成员统计:');
    console.log(`- 总人数: ${stats.members.total}`);
    console.log(`- 家长数: ${stats.members.parents}`);
    console.log(`- 儿童数: ${stats.members.children}`);
    
    console.log('\n📜 行为规则统计:');
    console.log(`- 活跃规则: ${stats.rules.active}`);
    
    console.log('\n🛍️ 商城统计:');
    console.log(`- 活跃商品: ${stats.shop.activeItems}`);
    
    console.log('\n🔄 兑换申请统计:');
    console.log(`- 待审批: ${stats.redemptions.pending}`);
    
    console.log('\n⭐ 积分统计:');
    console.log(`- 总获得积分: ${stats.points.totalEarned}`);
    console.log(`- 总消费积分: ${stats.points.totalSpent}`);
    console.log(`- 当前余额: ${stats.points.currentBalance}`);
    
    console.log('\n🏆 勋章统计:');
    console.log(`- 已获得勋章: ${stats.badges.earned}`);
    
    return true;
  } catch (error) {
    printError(`获取统计信息失败: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 6. 测试获取孩子/家长列表
async function testGetRelations() {
  printHeader('测试获取关系列表');
  
  if (currentUser === 'parent') {
    try {
      const response = await axios.get(`${BASE_URL}/family/my-children`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      printSuccess('获取孩子列表成功！');
      
      if (response.data.length === 0) {
        console.log('暂无关联的孩子');
      } else {
        console.log(`\n共有 ${response.data.length} 个孩子:\n`);
        response.data.forEach((child, index) => {
          console.log(`${index + 1}. ${child.username}`);
          console.log(`   - 关系: ${child.relation}`);
          console.log(`   - 主要监护人: ${child.isPrimary ? '是' : '否'}`);
          console.log(`   - 主题: ${child.theme}`);
          console.log(`   - 加入时间: ${new Date(child.createdAt).toLocaleString()}`);
          console.log('');
        });
      }
      
      return true;
    } catch (error) {
      printError(`获取孩子列表失败: ${error.response?.data?.message || error.message}`);
      return false;
    }
  } else {
    try {
      const response = await axios.get(`${BASE_URL}/family/my-parents`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      printSuccess('获取家长列表成功！');
      
      if (response.data.length === 0) {
        console.log('暂无关联的家长');
      } else {
        console.log(`\n共有 ${response.data.length} 个家长:\n`);
        response.data.forEach((parent, index) => {
          console.log(`${index + 1}. ${parent.username}`);
          console.log(`   - 关系: ${parent.relation}`);
          console.log(`   - 主要监护人: ${parent.isPrimary ? '是' : '否'}`);
          console.log(`   - 加入时间: ${new Date(parent.createdAt).toLocaleString()}`);
          console.log('');
        });
      }
      
      return true;
    } catch (error) {
      printError(`获取家长列表失败: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}

// 7. 测试照片上传功能（模拟）
async function testPhotoUpload() {
  printHeader('测试照片上传功能');
  
  printWarning('注意：照片上传需要实际文件，这里只演示API调用方式');
  
  console.log('\n📋 照片上传API信息:');
  console.log(`- 端点: POST ${BASE_URL}/family/upload-photo`);
  console.log(`- 方法: multipart/form-data`);
  console.log(`- 参数名: photo`);
  console.log(`- 支持格式: JPEG, JPG, PNG, GIF, WebP`);
  console.log(`- 最大大小: 5MB`);
  console.log(`- 认证: Bearer Token`);
  
  console.log('\n💡 使用示例 (curl):');
  console.log(color(`curl -X POST ${BASE_URL}/family/upload-photo \\`, 'cyan'));
  console.log(color(`  -H "Authorization: Bearer ${authToken.substring(0, 30)}..." \\`, 'cyan'));
  console.log(color(`  -F "photo=@/path/to/your/photo.jpg"`, 'cyan'));
  
  console.log('\n💡 使用示例 (JavaScript):');
  console.log(color(`const formData = new FormData();`, 'cyan'));
  console.log(color(`formData.append('photo', fileInput.files[0]);`, 'cyan'));
  console.log(color(``, 'cyan'));
  console.log(color(`const response = await fetch('${BASE_URL}/family/upload-photo', {`, 'cyan'));
  console.log(color(`  method: 'POST',`, 'cyan'));
  console.log(color(`  headers: {`, 'cyan'));
  console.log(color(`    'Authorization': 'Bearer ${authToken.substring(0, 30)}...'`, 'cyan'));
  console.log(color(`  },`, 'cyan'));
  console.log(color(`  body: formData`, 'cyan'));
  console.log(color(`});`, 'cyan'));
  
  return new Promise((resolve) => {
    rl.question('\n是否要测试照片删除功能？(y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        await testPhotoDelete();
      }
      resolve(true);
    });
  });
}

// 8. 测试照片删除功能
async function testPhotoDelete() {
  printHeader('测试照片删除功能');
  
  try {
    // 先检查是否有照片
    const familyInfo = await axios.get(`${BASE_URL}/family/info`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (!familyInfo.data.photo) {
      printWarning('当前没有设置家庭照片，无法测试删除功能');
      console.log('请先上传照片后再测试删除功能');
      return true;
    }
    
    console.log(`当前家庭照片: ${familyInfo.data.photo}`);
    
    return new Promise((resolve) => {
      rl.question('\n确认要删除家庭照片吗？(y/n): ', async (answer) => {
        if (answer.toLowerCase() !== 'y') {
          printInfo('取消删除操作');
          resolve(true);
          return;
        }
        
        try {
          const response = await axios.delete(`${BASE_URL}/family/photo`, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          
          printSuccess('删除家庭照片成功！');
          console.log(`响应消息: ${response.data.message}`);
          console.log(`照片字段: ${response.data.photo === null ? '已清空' : response.data.photo}`);
          
          resolve(true);
        } catch (error) {
          printError(`删除失败: ${error.response?.data?.message || error.message}`);
          resolve(false);
        }
      });
    });
  } catch (error) {
    printError(`检查照片状态失败: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 9. 测试更新家庭信息
async function testUpdateFamilyInfo() {
  printHeader('测试更新家庭信息');
  
  try {
    // 先获取当前信息
    const currentInfo = await axios.get(`${BASE_URL}/family/info`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`当前家庭名称: ${currentInfo.data.name}`);
    console.log(`当前家庭描述: ${currentInfo.data.description || '无'}`);
    
    return new Promise((resolve) => {
      rl.question('\n请输入新的家庭描述 (直接回车跳过): ', async (newDescription) => {
        const updateData = {};
        
        if (newDescription.trim()) {
          updateData.description = newDescription;
        }
        
        // 添加一些测试用的自定义文本
        updateData.customTexts = {
          ...currentInfo.data.customTexts,
          testField: `测试字段 - ${new Date().toLocaleTimeString()}`
        };
        
        try {
          const response = await axios.put(`${BASE_URL}/family/info`, updateData, {
            headers: { 
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          printSuccess('更新家庭信息成功！');
          console.log(`\n更新后的信息:`);
          console.log(`- 家庭名称: ${response.data.name}`);
          console.log(`- 家庭描述: ${response.data.description || '无'}`);
          console.log(`- 更新时间: ${new Date(response.data.updatedAt).toLocaleString()}`);
          
          if (response.data.customTexts) {
            console.log('\n自定义文本:');
            Object.entries(response.data.customTexts).forEach(([key, value]) => {
              console.log(`- ${key}: ${value}`);
            });
          }
          
          resolve(true);
        } catch (error) {
          printError(`更新失败: ${error.response?.data?.message || error.message}`);
          resolve(false);
        }
      });
    });
  } catch (error) {
    printError(`获取当前信息失败: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 主测试流程
async function runAllTests() {
  console.log(color('\n🎮 家庭路由系统交互式测试', 'magenta'));
  console.log(color('='.repeat(50), 'magenta'));
  
  // 1. 登录
  const loggedIn = await login();
  if (!loggedIn) {
    printError('登录失败，测试终止');
    rl.close();
    return;
  }
  
  // 2. 显示测试菜单
  const testFunctions = [
    { name: '获取家庭信息', func: testGetFamilyInfo },
    { name: '获取自定义文本模板', func: testGetCustomTextTemplates },
    { name: '更新自定义文本', func: testUpdateCustomText },
    { name: '获取家庭统计信息', func: testGetFamilyStats },
    { name: '获取关系列表', func: testGetRelations },
    { name: '测试照片上传功能', func: testPhotoUpload },
    { name: '更新家庭信息', func: testUpdateFamilyInfo },
    { name: '退出测试', func: null }
  ];
  
  let continueTesting = true;
  
  while (continueTesting) {
    console.log('\n' + color('📋 测试菜单:', 'yellow'));
    testFunctions.forEach((test, index) => {
      console.log(`${index + 1}. ${test.name}`);
    });
    
    const choice = await new Promise((resolve) => {
      rl.question('\n请选择测试项目 (1-8): ', resolve);
    });
    
    const choiceNum = parseInt(choice);
    
    if (choiceNum === 8 || isNaN(choiceNum) || choiceNum < 1 || choiceNum > 8) {
      printInfo('感谢测试！再见！');
      continueTesting = false;
    } else if (choiceNum === 7) {
      // 照片上传是特殊处理
      await testPhotoUpload();
    } else {
      const testFunc = testFunctions[choiceNum - 1].func;
      if (testFunc) {
        await testFunc();
      }
    }
    
    if (continueTesting) {
      const continueAnswer = await new Promise((resolve) => {
        rl.question('\n是否继续测试？(y/n): ', resolve);
      });
      
      if (continueAnswer.toLowerCase() !== 'y') {
        printInfo('测试结束！');
        continueTesting = false;
      }
    }
  }
  
  rl.close();
}

// 错误处理
process.on('unhandledRejection', (error) => {
  printError(`未处理的错误: ${error.message}`);
  rl.close();
  process.exit(1);
});

// 启动测试
runAllTests().catch(error => {
  printError(`测试运行失败: ${error.message}`);
  rl.close();
  process.exit(1);
});