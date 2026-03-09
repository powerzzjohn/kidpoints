import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../contexts/ThemeContext';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  condition: string;
  familyId: string | null;
}

interface BehaviorRule {
  id: string;
  name: string;
  description: string;
  points: number;
  category: string;
  isActive: boolean;
  effectiveDate: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export default function BadgeManagement() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { themeConfig } = useTheme();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [rules, setRules] = useState<BehaviorRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🏆',
    category: 'CUSTOM',
    ruleId: '',
    count: 3,
    period: 'week'
  });

  const iconOptions = ['🏆', '⭐', '🎖️', '👑', '💎', '🔥', '⚡', '🌟', '🎯', '🏅'];

  useEffect(() => {
    fetchBadges();
    fetchRules();
  }, []);

  const fetchBadges = async () => {
    try {
      const response = await api.get('/api/badges/templates');
      setBadges(response.data.badges);
    } catch (error: any) {
      console.error('获取勋章失败:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    try {
      const response = await api.get('/api/rules');
      // 规则模型中没有type字段，只有category字段，所以不过滤
      setRules(response.data.rules);
    } catch (error) {
      console.error('获取规则失败:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/badges/templates', formData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        icon: '🏆',
        category: 'CUSTOM',
        ruleId: '',
        count: 3,
        period: 'week'
      });
      fetchBadges();
    } catch (error: any) {
      alert(error.response?.data?.message || '创建勋章失败');
    }
  };

  const handleDelete = async (id: string, familyId: string | null) => {
    if (!familyId) {
      alert('系统预设勋章不能删除');
      return;
    }
    if (!confirm('确定要删除这个勋章吗？')) return;
    
    try {
      await api.delete(`/api/badges/templates/${id}`);
      fetchBadges();
    } catch (error: any) {
      alert(error.response?.data?.message || '删除勋章失败');
    }
  };

  const parseCondition = (condition: string) => {
    try {
      const cond = JSON.parse(condition);
      const rule = rules.find(r => r.id === cond.ruleId);
      const periodText = cond.period === 'week' ? '周' : '月';
      return `${rule?.name || '未知规则'} ${cond.count}次/${periodText}`;
    } catch {
      return '条件解析失败';
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${themeConfig.colors.background} flex items-center justify-center`}>
        <div className="text-white text-2xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeConfig.colors.background} p-6`}>
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={() => navigate('/parent/dashboard')}
              className="text-white hover:text-yellow-200 mb-2 flex items-center gap-2"
            >
              ← 返回首页
            </button>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              🏆 勋章管理
            </h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-purple-900 font-bold py-3 px-6 rounded-xl shadow-lg transform hover:scale-105 transition"
          >
            ➕ 创建自定义勋章
          </button>
        </div>

        {/* 勋章列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-6xl">{badge.icon}</div>
                {badge.familyId && (
                  <button
                    onClick={() => handleDelete(badge.id, badge.familyId)}
                    className="text-red-500 hover:text-red-700 text-xl"
                  >
                    🗑️
                  </button>
                )}
              </div>
              <h3 className="text-2xl font-bold text-purple-900 mb-2">{badge.name}</h3>
              <p className="text-gray-600 mb-3">{badge.description}</p>
              <div className="bg-purple-100 rounded-lg p-3">
                <p className="text-sm text-purple-700">
                  <span className="font-semibold">获得条件：</span>
                  {parseCondition(badge.condition)}
                </p>
              </div>
              {!badge.familyId && (
                <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                  ⚙️ 系统预设
                </div>
              )}
            </div>
          ))}
        </div>

        {badges.length === 0 && (
          <div className="text-center text-white text-xl mt-12">
            还没有勋章，快来创建第一个吧！
          </div>
        )}
      </div>

      {/* 创建勋章模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-bold text-purple-900 mb-6">创建自定义勋章</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">勋章名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">勋章描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">选择图标</label>
                <div className="grid grid-cols-5 gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`text-4xl p-2 rounded-lg border-2 ${
                        formData.icon === icon
                          ? 'border-purple-500 bg-purple-100'
                          : 'border-gray-300 hover:border-purple-300'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">关联规则</label>
                <select
                  value={formData.ruleId}
                  onChange={(e) => setFormData({ ...formData, ruleId: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  required
                >
                  <option value="">请选择规则</option>
                  {rules.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {rule.name} (+{rule.points}分)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">完成次数</label>
                  <input
                    type="number"
                    value={formData.count}
                    onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">时间周期</label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  >
                    <option value="week">每周</option>
                    <option value="month">每月</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg"
                >
                  创建勋章
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-3 rounded-lg"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
