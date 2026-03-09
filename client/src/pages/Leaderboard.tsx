import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import ThemeCard from '../components/theme/ThemeCard';

interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar: string | null;
  theme: string;
  totalPoints: number;
  earnedPoints: number;
  spentPoints: number;
  badgeCount: number;
  completedRules: number;
  redemptionCount: number;
  rank: number;
  joinedAt: string;
}

interface LeaderboardData {
  period: string;
  leaderboard: LeaderboardEntry[];
  totalChildren: number;
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { themeConfig } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [period, setPeriod] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/family/leaderboard?period=${period}`);
      setData(response.data);
    } catch (error: any) {
      console.error('加载排行榜失败:', error);
      alert(error.response?.data?.message || '加载排行榜失败');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-gray-300 to-gray-500';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    return 'from-blue-400 to-blue-600';
  };

  const getPeriodText = (p: string) => {
    const map: Record<string, string> = {
      all: '总榜',
      week: '周榜',
      month: '月榜'
    };
    return map[p] || p;
  };

  const handleBack = () => {
    navigate(user?.role === 'PARENT' ? '/parent/dashboard' : '/child/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🏆</div>
          <p className="text-gray-600">加载排行榜中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <span className="text-4xl mr-3">🏆</span>
              积分排行榜
            </h1>
            <p className="text-gray-600 mt-2">家庭成员积分排名</p>
          </div>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition"
          >
            返回
          </button>
        </div>

        {/* 时间段选择 */}
        <div className="mb-8 flex justify-center space-x-4">
          {(['all', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                period === p
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {getPeriodText(p)}
            </button>
          ))}
        </div>

        {/* 排行榜 */}
        {data && data.leaderboard.length > 0 ? (
          <div className="space-y-4">
            {data.leaderboard.map((entry, index) => {
              const isCurrentUser = entry.userId === user?.id;
              
              return (
                <ThemeCard
                  key={entry.userId}
                  className={`p-6 ${isCurrentUser ? 'ring-4 ring-purple-500 ring-opacity-50' : ''}`}
                >
                  <div className="flex items-center">
                    {/* 排名 */}
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getRankColor(entry.rank)} flex items-center justify-center text-white font-bold text-2xl mr-6 shadow-lg`}>
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* 用户信息 */}
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-xl font-bold text-gray-800">
                          {entry.username}
                          {isCurrentUser && (
                            <span className="ml-2 text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              我
                            </span>
                          )}
                        </h3>
                      </div>

                      {/* 统计信息 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {entry.totalPoints}
                          </div>
                          <div className="text-xs text-gray-600">总积分</div>
                        </div>

                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            +{entry.earnedPoints}
                          </div>
                          <div className="text-xs text-gray-600">获得</div>
                        </div>

                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            -{entry.spentPoints}
                          </div>
                          <div className="text-xs text-gray-600">消费</div>
                        </div>

                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {entry.badgeCount}
                          </div>
                          <div className="text-xs text-gray-600">勋章</div>
                        </div>
                      </div>

                      {/* 额外信息 */}
                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
                        <span>📝 完成 {entry.completedRules} 次任务</span>
                        <span>🎁 兑换 {entry.redemptionCount} 次</span>
                      </div>
                    </div>

                    {/* 奖杯动画（前三名） */}
                    {entry.rank <= 3 && (
                      <div className="ml-4 text-6xl animate-pulse">
                        {entry.rank === 1 && '👑'}
                        {entry.rank === 2 && '⭐'}
                        {entry.rank === 3 && '✨'}
                      </div>
                    )}
                  </div>
                </ThemeCard>
              );
            })}
          </div>
        ) : (
          <ThemeCard className="p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-600 text-lg">暂无排行数据</p>
            <p className="text-gray-500 text-sm mt-2">
              {period === 'week' && '本周还没有积分记录'}
              {period === 'month' && '本月还没有积分记录'}
              {period === 'all' && '还没有任何积分记录'}
            </p>
          </ThemeCard>
        )}

        {/* 统计信息 */}
        {data && data.leaderboard.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">👶</div>
              <div className="text-2xl font-bold">{data.totalChildren}</div>
              <div className="text-blue-100">参与成员</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-2xl font-bold">
                {data.leaderboard.reduce((sum, e) => sum + e.totalPoints, 0)}
              </div>
              <div className="text-green-100">总积分</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-2xl font-bold">
                {data.leaderboard.reduce((sum, e) => sum + e.badgeCount, 0)}
              </div>
              <div className="text-purple-100">总勋章</div>
            </div>
          </div>
        )}

        {/* 鼓励信息 */}
        {data && data.leaderboard.length > 0 && user?.role === 'CHILD' && (
          <div className="mt-8 p-6 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl border-2 border-yellow-300">
            <div className="flex items-center">
              <div className="text-4xl mr-4">💪</div>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">
                  {data.leaderboard.find(e => e.userId === user.id)?.rank === 1
                    ? '太棒了！你是第一名！'
                    : '继续加油，争取更好的名次！'}
                </h3>
                <p className="text-gray-700 text-sm">
                  完成更多任务，获得更多积分，就能提升排名哦！
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}