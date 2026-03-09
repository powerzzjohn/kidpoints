import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';

interface FamilyMember {
  id: string;
  username: string;
  avatar: string | null;
}

interface PointsRecord {
  id: string;
  amount: number;
  type: string;
  reason: string;
  createdAt: string;
  createdBy: {
    username: string;
  };
}

export default function PointsManagement() {
  const { themeConfig } = useTheme();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [balance, setBalance] = useState(0);
  const [records, setRecords] = useState<PointsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 表单状态
  const [operation, setOperation] = useState<'add' | 'deduct'>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    if (selectedMember) {
      loadMemberData();
    }
  }, [selectedMember]);

  const loadMembers = async () => {
    try {
      const res = await api.get('/api/points/family-members');
      setMembers(res.data.members);
      if (res.data.members.length > 0) {
        setSelectedMember(res.data.members[0].id);
      }
    } catch (error) {
      console.error('加载家庭成员失败:', error);
    }
  };

  const loadMemberData = async () => {
    if (!selectedMember) return;
    
    try {
      setLoading(true);
      const [balanceRes, recordsRes] = await Promise.all([
        api.get(`/api/points/balance/${selectedMember}`),
        api.get(`/api/points/records/${selectedMember}?limit=10`)
      ]);
      setBalance(balanceRes.data.balance);
      setRecords(recordsRes.data.records);
    } catch (error) {
      console.error('加载成员数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMember || !amount || !reason) {
      alert('请填写所有必填项');
      return;
    }

    const pointsAmount = parseInt(amount);
    if (isNaN(pointsAmount) || pointsAmount <= 0) {
      alert('请输入有效的积分数量');
      return;
    }

    try {
      setSubmitting(true);
      const endpoint = operation === 'add' ? '/api/points/add' : '/api/points/deduct';
      await api.post(endpoint, {
        userId: selectedMember,
        amount: pointsAmount,
        reason
      });

      // 清空表单
      setAmount('');
      setReason('');
      
      // 重新加载数据
      await loadMemberData();
      
      alert(`${operation === 'add' ? '添加' : '扣除'}积分成功！`);
    } catch (error: any) {
      console.error('操作失败:', error);
      alert(error.response?.data?.message || '操作失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeConfig.colors.background} p-6`}>
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-purple-800 mb-2">💰 积分管理</h1>
          <p className="text-gray-600">为孩子添加或扣除积分</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：操作表单 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">积分操作</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 选择成员 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择孩子
                </label>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.username}
                    </option>
                  ))}
                </select>
              </div>

              {/* 当前积分 */}
              {selectedMember && (
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 text-white">
                  <div className="text-sm opacity-90">当前积分</div>
                  <div className="text-3xl font-bold">{loading ? '...' : balance}</div>
                </div>
              )}

              {/* 操作类型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  操作类型
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setOperation('add')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                      operation === 'add'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ➕ 添加积分
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperation('deduct')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                      operation === 'deduct'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ➖ 扣除积分
                  </button>
                </div>
              </div>

              {/* 积分数量 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  积分数量
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  placeholder="请输入积分数量"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              {/* 原因说明 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  原因说明
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="请输入原因（例如：完成作业、整理房间等）"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={submitting || !selectedMember}
                className={`w-full py-3 rounded-lg font-bold text-white transition ${
                  operation === 'add'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {submitting ? '处理中...' : operation === 'add' ? '确认添加' : '确认扣除'}
              </button>
            </form>
          </div>

          {/* 右侧：最近记录 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">最近记录</h2>
            
            {loading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <div>还没有记录</div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 bg-gray-50 rounded-lg border-l-4"
                    style={{
                      borderColor: record.amount > 0 ? '#10b981' : '#ef4444'
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-800">{record.reason}</div>
                      <div
                        className={`text-xl font-bold ${
                          record.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {record.amount > 0 ? '+' : ''}{record.amount}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(record.createdAt)} · {record.createdBy.username}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
