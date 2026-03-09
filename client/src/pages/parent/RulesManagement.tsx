import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';

interface Rule {
  id: string;
  name: string;
  description: string;
  points: number;
  category: string;
  isActive: boolean;
  effectiveDate: string;
  createdBy: {
    username: string;
  };
  confirmations: Array<{
    user: {
      username: string;
    };
  }>;
}

export default function RulesManagement() {
  const { themeConfig } = useTheme();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    points: '',
    category: 'STUDY',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/rules?includeInactive=true');
      setRules(res.data.rules);
    } catch (error) {
      console.error('加载规则失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.points) {
      alert('请填写所有必填项');
      return;
    }

    try {
      if (editingRule) {
        await api.put(`/api/rules/${editingRule.id}`, {
          ...formData,
          points: parseInt(formData.points)
        });
      } else {
        await api.post('/api/rules', {
          ...formData,
          points: parseInt(formData.points)
        });
      }

      setShowForm(false);
      setEditingRule(null);
      resetForm();
      await loadRules();
      alert(editingRule ? '规则更新成功！' : '规则创建成功！');
    } catch (error: any) {
      console.error('操作失败:', error);
      alert(error.response?.data?.message || '操作失败，请重试');
    }
  };

  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      points: rule.points.toString(),
      category: rule.category,
      effectiveDate: new Date(rule.effectiveDate).toISOString().split('T')[0]
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条规则吗？')) return;

    try {
      await api.delete(`/api/rules/${id}`);
      await loadRules();
      alert('规则删除成功！');
    } catch (error: any) {
      console.error('删除失败:', error);
      alert(error.response?.data?.message || '删除失败，请重试');
    }
  };

  const toggleActive = async (rule: Rule) => {
    try {
      await api.put(`/api/rules/${rule.id}`, {
        isActive: !rule.isActive
      });
      await loadRules();
    } catch (error: any) {
      console.error('切换状态失败:', error);
      alert(error.response?.data?.message || '操作失败，请重试');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      points: '',
      category: 'STUDY',
      effectiveDate: new Date().toISOString().split('T')[0]
    });
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

  const getCategoryColor = (category: string) => {
    const map: Record<string, string> = {
      STUDY: 'bg-blue-100 text-blue-700',
      CHORES: 'bg-green-100 text-green-700',
      EXERCISE: 'bg-orange-100 text-orange-700',
      BEHAVIOR: 'bg-purple-100 text-purple-700'
    };
    return map[category] || 'bg-gray-100 text-gray-700';
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
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-purple-800 mb-2">📋 行为规则管理</h1>
            <p className="text-gray-600">创建和管理家庭行为规则</p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingRule(null);
              resetForm();
            }}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-bold transition"
          >
            {showForm ? '取消' : '+ 创建新规则'}
          </button>
        </div>

        {/* 创建/编辑表单 */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingRule ? '编辑规则' : '创建新规则'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    规则名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：完成作业"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    积分 *
                  </label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                    placeholder="正数为奖励，负数为惩罚"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    类别 *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="STUDY">学习</option>
                    <option value="CHORES">家务</option>
                    <option value="EXERCISE">运动</option>
                    <option value="BEHAVIOR">行为</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    生效日期 *
                  </label>
                  <input
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  规则描述 *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="详细描述规则内容和要求"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-bold transition"
                >
                  {editingRule ? '保存修改' : '创建规则'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRule(null);
                    resetForm();
                  }}
                  className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-bold transition"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 规则列表 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {rules.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-6xl mb-4">📋</div>
              <div className="text-xl">还没有规则</div>
              <div className="text-sm mt-2">点击上方按钮创建第一条规则</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {rules.map((rule) => (
                <div key={rule.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-800">{rule.name}</h3>
                        <span className={`text-xs px-3 py-1 rounded-full ${getCategoryColor(rule.category)}`}>
                          {getCategoryName(rule.category)}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full ${
                          rule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {rule.isActive ? '已激活' : '待确认'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{rule.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>积分: <span className={`font-bold ${rule.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {rule.points > 0 ? '+' : ''}{rule.points}
                        </span></span>
                        <span>生效日期: {new Date(rule.effectiveDate).toLocaleDateString('zh-CN')}</span>
                        {rule.confirmations.length > 0 && (
                          <span>已确认: {rule.confirmations.map(c => c.user.username).join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => toggleActive(rule)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          rule.isActive
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {rule.isActive ? '停用' : '激活'}
                      </button>
                      <button
                        onClick={() => handleEdit(rule)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
                      >
                        删除
                      </button>
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
