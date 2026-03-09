import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

interface Rule {
  id: string;
  name: string;
  description: string;
  points: number;
  category: string;
  effectiveDate: string;
  createdBy: {
    username: string;
  };
}

export default function RulesConfirmation() {
  const navigate = useNavigate();
  const { themeConfig } = useTheme();
  const [pendingRules, setPendingRules] = useState<Rule[]>([]);
  const [activeRules, setActiveRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const [pendingRes, activeRes] = await Promise.all([
        api.get('/api/rules/pending/confirmations'),
        api.get('/api/rules')
      ]);
      setPendingRules(pendingRes.data.rules);
      setActiveRules(activeRes.data.rules);
    } catch (error) {
      console.error('加载规则失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (ruleId: string) => {
    try {
      await api.post(`/api/rules/${ruleId}/confirm`);
      alert('规则确认成功！');
      await loadRules();
    } catch (error: any) {
      console.error('确认失败:', error);
      alert(error.response?.data?.message || '确认失败，请重试');
    }
  };

  const getCategoryName = (category: string) => {
    const map: Record<string, string> = {
      STUDY: '学习',
      CHORES: '家务',
      EXERCISE: '运动',
      BEHAVIOR: '行为'
    };
    return map[category] || category;
  };

  const getCategoryEmoji = (category: string) => {
    const map: Record<string, string> = {
      STUDY: '📚',
      CHORES: '🧹',
      EXERCISE: '⚽',
      BEHAVIOR: '⭐'
    };
    return map[category] || '📋';
  };

  const getCategoryColor = (category: string) => {
    const map: Record<string, string> = {
      STUDY: 'from-blue-400 to-blue-500',
      CHORES: 'from-green-400 to-green-500',
      EXERCISE: 'from-orange-400 to-orange-500',
      BEHAVIOR: 'from-purple-400 to-purple-500'
    };
    return map[category] || 'from-gray-400 to-gray-500';
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gradient-to-br ${themeConfig.colors.background}`}>
        <div className="text-xl text-white">加载中...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeConfig.colors.background} p-6`}>
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/child/dashboard')}
            className="mb-4 text-purple-600 hover:text-purple-800 font-medium"
          >
            ← 返回首页
          </button>
          <h1 className="text-3xl font-bold text-purple-800 mb-2">📋 家庭规则</h1>
          <p className="text-gray-600">查看和确认家庭行为规则</p>
        </div>

        {/* 待确认规则 */}
        {pendingRules.length > 0 && (
          <div className="mb-8">
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4 rounded-r-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <p className="font-bold text-yellow-800">有新规则需要确认</p>
                  <p className="text-sm text-yellow-700">请仔细阅读并确认你理解这些规则</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {pendingRules.map((rule) => (
                <div key={rule.id} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className={`text-5xl bg-gradient-to-br ${getCategoryColor(rule.category)} w-20 h-20 rounded-xl flex items-center justify-center shadow-lg`}>
                      {getCategoryEmoji(rule.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">{rule.name}</h3>
                        <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                          {getCategoryName(rule.category)}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{rule.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span className={`font-bold ${rule.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {rule.points > 0 ? '+' : ''}{rule.points} 积分
                        </span>
                        <span>生效日期: {new Date(rule.effectiveDate).toLocaleDateString('zh-CN')}</span>
                        <span>创建者: {rule.createdBy.username}</span>
                      </div>
                      <button
                        onClick={() => handleConfirm(rule.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-bold transition"
                      >
                        ✓ 我已理解并确认
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 已激活规则 */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📌 当前规则</h2>
          {activeRules.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-500">
              <div className="text-6xl mb-4">📋</div>
              <div className="text-xl">还没有激活的规则</div>
              <div className="text-sm mt-2">等待家长创建规则</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeRules.map((rule) => (
                <div key={rule.id} className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition">
                  <div className="flex items-start gap-3">
                    <div className={`text-3xl bg-gradient-to-br ${getCategoryColor(rule.category)} w-14 h-14 rounded-lg flex items-center justify-center shadow`}>
                      {getCategoryEmoji(rule.category)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 mb-1">{rule.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${rule.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {rule.points > 0 ? '+' : ''}{rule.points} 积分
                        </span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-500">{getCategoryName(rule.category)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
