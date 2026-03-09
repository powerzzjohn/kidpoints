import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeCard from '../../components/theme/ThemeCard';

interface BadgeWithProgress {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  condition: string;
  familyId: string | null;
  earned: boolean;
  earnedAt?: string;
  progress: number;
  currentCount?: number;
  targetCount?: number;
}

export default function BadgeCollection() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const { themeConfig } = useTheme();
  const [badges, setBadges] = useState<BadgeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'earned' | 'unearned'>('all');

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const response = await api.get(`/api/badges/user/${user?.id}`);
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

  const filteredBadges = badges.filter((badge) => {
    if (filter === 'earned') return badge.earned;
    if (filter === 'unearned') return !badge.earned;
    return true;
  });

  const earnedCount = badges.filter((b) => b.earned).length;
  const totalCount = badges.length;

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
        <div className="mb-8">
          <button
            onClick={() => navigate('/child/dashboard')}
            className="text-white hover:text-yellow-200 mb-2 flex items-center gap-2"
          >
            ← 返回首页
          </button>
          <h1 className="text-4xl font-bold text-white flex items-center gap-3 mb-4">
            {themeConfig.elements.badgeIcon} 我的勋章墙
          </h1>
          
          {/* 统计卡片 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-2">勋章收集进度</p>
                <p className="text-4xl font-bold text-purple-600">
                  {earnedCount} / {totalCount}
                </p>
              </div>
              <div className="text-8xl">
                {earnedCount === totalCount && totalCount > 0 ? '👑' : '🎯'}
              </div>
            </div>
            <div className="mt-4 bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full transition-all duration-500"
                style={{ width: `${totalCount > 0 ? (earnedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* 筛选按钮 */}
          <div className="flex gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-lg font-bold transition ${
                filter === 'all'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-white/30 text-white hover:bg-white/50'
              }`}
            >
              全部 ({totalCount})
            </button>
            <button
              onClick={() => setFilter('earned')}
              className={`px-6 py-2 rounded-lg font-bold transition ${
                filter === 'earned'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-white/30 text-white hover:bg-white/50'
              }`}
            >
              已获得 ({earnedCount})
            </button>
            <button
              onClick={() => setFilter('unearned')}
              className={`px-6 py-2 rounded-lg font-bold transition ${
                filter === 'unearned'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'bg-white/30 text-white hover:bg-white/50'
              }`}
            >
              未获得 ({totalCount - earnedCount})
            </button>
          </div>
        </div>

        {/* 勋章网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBadges.map((badge) => (
            <div
              key={badge.id}
              className={`bg-white rounded-2xl shadow-xl p-6 transform hover:scale-105 transition ${
                !badge.earned ? 'opacity-75' : ''
              }`}
            >
              <div className="text-center mb-4">
                <div className={`text-8xl mb-2 ${!badge.earned ? 'grayscale' : ''}`}>
                  {badge.icon}
                </div>
                {badge.earned && (
                  <div className="inline-block bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                    ✓ 已获得
                  </div>
                )}
              </div>

              <h3 className="text-2xl font-bold text-purple-900 mb-2 text-center">
                {badge.name}
              </h3>
              <p className="text-gray-600 text-center mb-4">{badge.description}</p>

              {!badge.earned && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>进度</span>
                    <span className="font-bold">
                      {badge.currentCount || 0} / {badge.targetCount || 0}
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-purple-500 h-full transition-all duration-500"
                      style={{ width: `${badge.progress}%` }}
                    />
                  </div>
                  <p className="text-center text-sm text-purple-600 font-semibold">
                    {badge.progress}% 完成
                  </p>
                </div>
              )}

              {badge.earned && badge.earnedAt && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  获得时间：{new Date(badge.earnedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>

        {filteredBadges.length === 0 && (
          <div className="text-center text-white text-xl mt-12">
            {filter === 'earned' && '还没有获得任何勋章，加油哦！'}
            {filter === 'unearned' && '太棒了！你已经获得所有勋章了！'}
            {filter === 'all' && '还没有勋章，请联系家长创建勋章'}
          </div>
        )}
      </div>
    </div>
  );
}
