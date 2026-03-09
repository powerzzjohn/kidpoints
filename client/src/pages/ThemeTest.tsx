import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import socketService from '../lib/socket';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeTest() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { themeConfig } = useTheme();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addTestResult = (result: string, success: boolean) => {
    setTestResults(prev => [...prev, `${success ? '✅' : '❌'} ${result}`]);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  // 测试Socket连接
  const testSocketConnection = async () => {
    addTestResult('检查Socket连接状态...', true);
    const isConnected = socketService.getConnectionStatus();
    addTestResult(`Socket连接状态: ${isConnected ? '已连接' : '未连接'}`, isConnected);
    
    if (!isConnected) {
      addTestResult('尝试连接Socket...', true);
      socketService.connect();
      // 等待连接
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newStatus = socketService.getConnectionStatus();
      addTestResult(`重新检查连接状态: ${newStatus ? '已连接' : '未连接'}`, newStatus);
    }
  };

  // 测试发送消息
  const testSendMessage = () => {
    try {
      socketService.sendMessage('这是一条测试消息');
      addTestResult('发送测试消息成功', true);
    } catch (error) {
      addTestResult(`发送消息失败: ${error.message}`, false);
    }
  };

  // 测试积分变化通知
  const testPointsNotification = async () => {
    if (!user) return;
    
    try {
      const response = await api.post('/api/points/add', {
        userId: user.id,
        amount: 5,
        reason: '测试通知功能'
      });
      addTestResult('触发积分变化通知成功', true);
      addTestResult(`积分添加: +5 (原因: 测试通知功能)`, true);
    } catch (error: any) {
      addTestResult(`触发积分变化失败: ${error.response?.data?.message || error.message}`, false);
    }
  };

  // 测试规则确认通知
  const testRuleNotification = async () => {
    try {
      // 先创建一个测试规则
      const ruleResponse = await api.post('/api/rules', {
        name: '测试通知规则',
        description: '用于测试通知功能的规则',
        points: 10,
        category: 'STUDY',
        effectiveDate: new Date().toISOString()
      });
      
      const ruleId = ruleResponse.data.rule.id;
      addTestResult('创建测试规则成功', true);
      
      // 确认规则
      await api.post(`/api/rules/${ruleId}/confirm`, {});
      addTestResult('确认规则成功，应触发通知', true);
      
      // 清理规则
      await api.delete(`/api/rules/${ruleId}`);
      addTestResult('清理测试规则', true);
      
    } catch (error: any) {
      addTestResult(`规则测试失败: ${error.response?.data?.message || error.message}`, false);
    }
  };

  // 测试兑换申请通知
  const testRedemptionNotification = async () => {
    try {
      // 先创建一个测试商品
      const itemResponse = await api.post('/api/shop/items', {
        name: '测试通知商品',
        description: '用于测试通知功能的商品',
        points: 10,
        type: 'VIRTUAL',
        category: 'TOY',
        stock: 5
      });
      
      const itemId = itemResponse.data.item.id;
      addTestResult('创建测试商品成功', true);
      
      // 申请兑换
      const redemptionResponse = await api.post('/api/redemptions', {
        itemId,
        quantity: 1
      });
      addTestResult('申请兑换成功，应触发通知', true);
      
      // 清理商品
      await api.delete(`/api/shop/items/${itemId}`);
      addTestResult('清理测试商品', true);
      
    } catch (error: any) {
      addTestResult(`兑换测试失败: ${error.response?.data?.message || error.message}`, false);
    }
  };

  // 运行所有测试
  const runAllTests = async () => {
    setIsTesting(true);
    clearTestResults();
    
    addTestResult('开始实时通知功能测试', true);
    addTestResult(`当前用户: ${user?.username} (${user?.role})`, true);
    addTestResult(`当前主题: ${themeConfig.name}`, true);
    
    // 测试Socket连接
    await testSocketConnection();
    
    // 测试各种通知
    addTestResult('', true); // 空行
    addTestResult('=== 测试各种通知类型 ===', true);
    
    // 测试发送消息
    testSendMessage();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试积分变化通知
    await testPointsNotification();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试规则确认通知（仅儿童）
    if (user?.role === 'CHILD') {
      await testRuleNotification();
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      addTestResult('跳过规则确认测试（需要儿童角色）', true);
    }
    
    // 测试兑换申请通知（仅儿童）
    if (user?.role === 'CHILD') {
      await testRedemptionNotification();
    } else {
      addTestResult('跳过兑换申请测试（需要儿童角色）', true);
    }
    
    addTestResult('', true); // 空行
    addTestResult('测试完成！请查看右上角的通知显示', true);
    addTestResult('如果看到各种通知弹出，说明功能正常', true);
    
    setIsTesting(false);
  };

  const handleBack = () => {
    navigate(user?.role === 'PARENT' ? '/parent/dashboard' : '/child/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">实时通知功能测试</h1>
            <p className="text-gray-600 mt-2">测试Socket.io实时通信和通知显示功能</p>
          </div>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition"
          >
            返回仪表板
          </button>
        </div>

        {/* 主题信息 */}
        <div className="mb-8 p-6 bg-white rounded-xl shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">{themeConfig.icon}</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{themeConfig.name} 主题</h2>
              <p className="text-gray-600">{themeConfig.description}</p>
            </div>
          </div>
        </div>

        {/* 测试控制面板 */}
        <div className="mb-8 p-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">测试控制</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <button
              onClick={runAllTests}
              disabled={isTesting}
              className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {isTesting ? '测试中...' : '运行所有测试'}
            </button>
            
            <button
              onClick={testSocketConnection}
              className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition"
            >
              测试Socket连接
            </button>
            
            <button
              onClick={testSendMessage}
              className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition"
            >
              发送测试消息
            </button>
            
            <button
              onClick={testPointsNotification}
              className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition"
            >
              测试积分通知
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user?.role === 'CHILD' && (
              <>
                <button
                  onClick={testRuleNotification}
                  className="px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition"
                >
                  测试规则通知
                </button>
                
                <button
                  onClick={testRedemptionNotification}
                  className="px-4 py-3 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-lg transition"
                >
                  测试兑换通知
                </button>
              </>
            )}
          </div>
          
          <button
            onClick={clearTestResults}
            className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition"
          >
            清除测试结果
          </button>
        </div>

        {/* 测试结果 */}
        <div className="p-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">测试结果</h2>
          
          {testResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">🔔</div>
              <p>点击上面的按钮开始测试</p>
              <p className="text-sm mt-2">测试结果将显示在这里，同时右上角会显示实时通知</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto p-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    result.includes('✅') ? 'bg-green-50 border border-green-200' :
                    result.includes('❌') ? 'bg-red-50 border border-red-200' :
                    'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-2">{result.includes('✅') ? '✅' : result.includes('❌') ? '❌' : '📝'}</span>
                    <span className={result.includes('❌') ? 'text-red-700' : 'text-gray-700'}>
                      {result.replace('✅ ', '').replace('❌ ', '')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 使用说明 */}
        <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">使用说明</h3>
          <ul className="space-y-2 text-blue-700">
            <li>• 点击"运行所有测试"按钮，系统会自动测试所有通知功能</li>
            <li>• 测试过程中，右上角应该会显示各种实时通知</li>
            <li>• 如果看到通知弹出，说明实时通信功能正常工���</li>
            <li>• 可以单独测试各个功能模块</li>
            <li>• 通知会自动在5秒后消失，也可以手动点击关闭</li>
          </ul>
          
          <div className="mt-4 p-4 bg-white rounded-lg border border-blue-300">
            <h4 className="font-semibold text-blue-800 mb-2">预期看到的通知类型：</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center">
                <span className="mr-2">💰</span>
                <span>积分变化通知</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">💬</span>
                <span>实时消息通知</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">📝</span>
                <span>规则确认通知</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🎁</span>
                <span>兑换申请通知</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}