import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

interface Redemption {
  id: string;
  points: number;
  status: string;
  requestedAt: string;
  processedAt: string | null;
  notes: string | null;
  item: {
    name: string;
    description: string;
    image: string | null;
  };
  processor: {
    username: string;
  } | null;
}

export default function Redemptions() {
  const navigate = useNavigate();
  const { themeConfig } = useTheme();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRedemptions();
  }, []);

  const loadRedemptions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/redemptions');
      setRedemptions(res.data.redemptions);
    } catch (error) {
      console.error('加载兑换记录失败:', error);
    } finally {
      setLoading(false);
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

  const getStatusEmoji = (status: string) => {
    const map: Record<string, string> = {
      PENDING: '⏳',
      APPROVED: '✅',
      REJECTED: '❌',
      COMPLETED: '🎉'
    };
    return map[status] || '📦';
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
      <div className={`flex items-center justify-center min-h-screen bg-gradient-to-br ${themeConfig.colors.background}`}>
        <div className="text-xl text-white">加载中...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeConfig.colors.background} p-6`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/child/shop')}
            className="mb-4 text-purple-600 hover:text-purple-800 font-medium"
          >
            ← 返回商城
          </button>
          <h1 className="text-3xl font-bold text-purple-800 mb-2">🎁 我的兑换记录</h1>
          <p className="text-gray-600">查看所有兑换申请的状态</p>
        </div>

        {redemptions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-500">
            <div className="text-6xl mb-4">📦</div>
            <div className="text-xl">还没有兑换记录</div>
            <div className="text-sm mt-2">去商城看看吧！</div>
            <button
              onClick={() => navigate('/child/shop')}
              className="mt-6 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-bold transition"
            >
              前往商城
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {redemptions.map((redemption) => (
              <div key={redemption.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center flex-shrink-0">
                    {redemption.item.image ? (
                      <img
                        src={redemption.item.image}
                        alt={redemption.item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-4xl">🎁</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                          {redemption.item.name}
                        </h3>
                        <p className="text-sm text-gray-600">{redemption.item.description}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(redemption.status)}`}>
                        {getStatusEmoji(redemption.status)} {getStatusText(redemption.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                      <span className="font-bold text-purple-600">{redemption.points} 积分</span>
                      <span>申请时间: {formatDate(redemption.requestedAt)}</span>
                    </div>
                    {redemption.processedAt && (
                      <div className="text-sm text-gray-500">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
