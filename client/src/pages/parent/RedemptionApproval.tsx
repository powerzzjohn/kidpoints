import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';

interface Redemption {
  id: string;
  points: number;
  status: string;
  requestedAt: string;
  processedAt: string | null;
  notes: string | null;
  user: {
    username: string;
    avatar: string | null;
  };
  item: {
    name: string;
    description: string;
    image: string | null;
  };
  processor: {
    username: string;
  } | null;
}

export default function RedemptionApproval() {
  const { themeConfig } = useTheme();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processed'>('pending');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadRedemptions();
  }, [filter]);

  const loadRedemptions = async () => {
    try {
      setLoading(true);
      const status = filter === 'pending' ? 'PENDING' : filter === 'processed' ? undefined : undefined;
      const url = status ? `/api/redemptions?status=${status}` : '/api/redemptions';
      const res = await api.get(url);
      
      let data = res.data.redemptions;
      if (filter === 'processed') {
        data = data.filter((r: Redemption) => r.status !== 'PENDING');
      }
      
      setRedemptions(data);
    } catch (error) {
      console.error('加载兑换记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id: string, status: 'APPROVED' | 'REJECTED' | 'COMPLETED', notes?: string) => {
    try {
      setProcessingId(id);
      await api.put(`/api/redemptions/${id}`, { status, notes });
      alert(`已${status === 'APPROVED' ? '批准' : status === 'REJECTED' ? '拒绝' : '完成'}该兑换申请`);
      await loadRedemptions();
    } catch (error: any) {
      console.error('处理失败:', error);
      alert(error.response?.data?.message || '处理失败，请重试');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprove = (redemption: Redemption) => {
    if (confirm(`确定批准 ${redemption.user.username} 兑换 ${redemption.item.name} 吗？\n将扣除 ${redemption.points} 积分`)) {
      handleProcess(redemption.id, 'APPROVED');
    }
  };

  const handleReject = (redemption: Redemption) => {
    const notes = prompt(`请输入拒绝原因（可选）：`);
    if (notes !== null) {
      handleProcess(redemption.id, 'REJECTED', notes || undefined);
    }
  };

  const handleComplete = (redemption: Redemption) => {
    if (confirm(`确认已将 ${redemption.item.name} 交付给 ${redemption.user.username}？`)) {
      handleProcess(redemption.id, 'COMPLETED');
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      PENDING: '待审批',
      APPROVED: '已批准',
      REJECTED: '已拒绝',
      COMPLETED: '已完成'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
      COMPLETED: 'bg-blue-100 text-blue-700'
    };
    return map[status] || 'bg-gray-100 text-gray-700';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeConfig.colors.background} p-6`}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-purple-800 mb-2">🎁 兑换审批</h1>
          <p className="text-gray-600">处理儿童的礼品兑换申请</p>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter('pending')}
            className={`px-6 py-3 rounded-lg font-bold transition ${
              filter === 'pending'
                ? 'bg-purple-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            待审批
          </button>
          <button
            onClick={() => setFilter('processed')}
            className={`px-6 py-3 rounded-lg font-bold transition ${
              filter === 'processed'
                ? 'bg-purple-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            已处理
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-lg font-bold transition ${
              filter === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            全部
          </button>
        </div>

        {redemptions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-500">
            <div className="text-6xl mb-4">📦</div>
            <div className="text-xl">
              {filter === 'pending' ? '暂无待审批的申请' : '暂无记录'}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {redemptions.map((redemption) => (
              <div key={redemption.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center flex-shrink-0">
                    {redemption.item.image ? (
                      <img
                        src={redemption.item.image}
                        alt={redemption.item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-5xl">🎁</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-gray-800">
                            {redemption.item.name}
                          </h3>
                          <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(redemption.status)}`}>
                            {getStatusText(redemption.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{redemption.item.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="font-bold text-purple-600">{redemption.points} 积分</span>
                          <span>申请人: {redemption.user.username}</span>
                          <span>申请时间: {formatDate(redemption.requestedAt)}</span>
                        </div>
                        {redemption.processedAt && (
                          <div className="text-sm text-gray-500 mt-1">
                            处理时间: {formatDate(redemption.processedAt)}
                            {redemption.processor && ` · 处理人: ${redemption.processor.username}`}
                          </div>
                        )}
                        {redemption.notes && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                            <span className="font-medium">备注: </span>
                            {redemption.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    {redemption.status === 'PENDING' && (
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleApprove(redemption)}
                          disabled={processingId === redemption.id}
                          className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition disabled:opacity-50"
                        >
                          ✓ 批准
                        </button>
                        <button
                          onClick={() => handleReject(redemption)}
                          disabled={processingId === redemption.id}
                          className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-50"
                        >
                          ✗ 拒绝
                        </button>
                      </div>
                    )}
                    {redemption.status === 'APPROVED' && (
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleComplete(redemption)}
                          disabled={processingId === redemption.id}
                          className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50"
                        >
                          ✓ 标记为已完成
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
