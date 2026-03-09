import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../contexts/ThemeContext';

interface PointsRecord {
  id: string;
  amount: number;
  type: string;
  reason: string;
  createdAt: string;
  rule?: {
    name: string;
    category: string;
  };
  createdBy: {
    username: string;
    role: string;
  };
}

export default function PointsHistory() {
  const { user } = useAuthStore();
  const { themeConfig } = useTheme();
  const [records, setRecords] = useState<PointsRecord[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recordsRes, balanceRes] = await Promise.all([
        api.get('/api/points/records'),
        api.get('/api/points/balance')
      ]);
      setRecords(recordsRes.data.records);
      setBalance(balanceRes.data.balance);
    } catch (error) {
      console.error('加载积分数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'EARN':
        return 'text-green-600';
      case 'SPEND':
        return 'text-red-600';
      case 'BONUS':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'EARN':
        return '获得';
      case 'SPEND':
        return '消费';
      case 'BONUS':
        return '奖励';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
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
          <h1 className="text-3xl font-bold text-purple-800 mb-2">💰 积分历史</h1>
          <p className="text-gray-600">查看你的所有积分记录</p>
        </div>

        {/* 积分余额卡片 */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 mb-6 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-2">当前积分</div>
          <div className="text-5xl font-bold">{balance}</div>
          <div className="text-sm opacity-90 mt-2">继续加油！🎉</div>
        </div>

        {/* 积分记录列表 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {records.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-6xl mb-4">📝</div>
              <div className="text-xl">还没有积分记录</div>
              <div className="text-sm mt-2">完成任务来获得第一个积分吧！</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {records.map((record) => (
                <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-500">{getTypeText(record.type)}</span>
                        {record.rule && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            {record.rule.name}
                          </span>
                        )}
                      </div>
                      <div className="font-medium text-gray-800">{record.reason}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(record.createdAt)} · 由 {record.createdBy.username} 操作
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${getTypeColor(record.type)}`}>
                      {record.amount > 0 ? '+' : ''}{record.amount}
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
