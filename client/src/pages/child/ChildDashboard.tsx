import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeSwitcher from '../../components/ThemeSwitcher';
import ThemeCard from '../../components/theme/ThemeCard';
import PointsDisplay from '../../components/theme/PointsDisplay';

interface Parent {
  id: string;
  username: string;
  avatar?: string;
  relation: string;
  isPrimary: boolean;
}

export default function ChildDashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const { themeConfig } = useTheme();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [myParents, setMyParents] = useState<Parent[]>([]);

  useEffect(() => {
    loadBalance();
    loadMyParents();
  }, []);

  const loadBalance = async () => {
    try {
      const res = await api.get('/api/points/balance');
      setBalance(res.data.balance);
    } catch (error) {
      console.error('加载积分失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyParents = async () => {
    try {
      const response = await api.get('/api/family/my-parents');
      setMyParents(response.data);
    } catch (error) {
      console.error('加载家长列表失败:', error);
    }
  };

  const getRelationText = (relation: string) => {
    const map: Record<string, string> = {
      father: '爸爸',
      mother: '妈妈',
      guardian: '监护人',
      parent: '家长'
    };
    return map[relation] || relation;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeConfig.colors.background}`}>
      {/* 顶部导航栏 */}
      <nav className="bg-white/90 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{themeConfig.elements.headerIcon}</span>
              <div>
                <h1 className="text-xl font-bold text-gray-800">我的积分世界</h1>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-gray-500">主题: {themeConfig.name}</p>
                  <ThemeSwitcher />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">欢迎回来</p>
                <p className="font-bold text-gray-800">{user?.username}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
              >
                {themeConfig.elements.logoutIcon} 退出
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 我的家长 */}
        {myParents.length > 0 && (
          <div className="mb-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
              <span className="mr-2">👨‍👩‍👧</span>
              我的家长
            </h2>
            <div className="flex flex-wrap gap-3">
              {myParents.map((parent) => (
                <div
                  key={parent.id}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg px-4 py-2 border-2 border-purple-200"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {parent.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{parent.username}</p>
                      <p className="text-xs text-gray-600">
                        {getRelationText(parent.relation)}
                        {parent.isPrimary && ' ⭐'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 积分展示卡片 */}
        <ThemeCard className="mb-8 p-8">
          <div className="text-center">
            <p className="text-gray-600 mb-2">我的总积分</p>
            <PointsDisplay points={loading ? 0 : balance} size="lg" />
            <div className="flex justify-center space-x-4 text-sm mt-4">
              <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full">
                🎯 继续加油！
              </div>
            </div>
          </div>
        </ThemeCard>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ThemeCard 
            onClick={() => navigate('/child/points-history')}
            icon="📊"
            title="积分记录"
          >
            <p className="text-gray-600 text-sm text-center">查看我的积分历史</p>
          </ThemeCard>

          <ThemeCard 
            onClick={() => navigate('/child/shop')}
            icon={themeConfig.elements.shopIcon}
            title="积分商城"
          >
            <p className="text-gray-600 text-sm text-center">兑换心仪的礼物</p>
          </ThemeCard>

          <ThemeCard 
            onClick={() => navigate('/child/badges')}
            icon={themeConfig.elements.badgeIcon}
            title="我的勋章"
          >
            <p className="text-gray-600 text-sm text-center">查看获得的成就</p>
          </ThemeCard>

          <ThemeCard 
            icon="⚙️"
            title="个人设置"
          >
            <p className="text-gray-600 text-sm text-center">更换主题和头像</p>
          </ThemeCard>

          <ThemeCard 
            onClick={() => navigate('/test-notifications')}
            icon="🔔"
            title="通知测试"
          >
            <p className="text-gray-600 text-sm text-center">测试实时通知功能</p>
          </ThemeCard>

          <ThemeCard 
            onClick={() => navigate('/leaderboard')}
            icon="🏆"
            title="积分排行榜"
          >
            <p className="text-gray-600 text-sm text-center">查看我的排名</p>
          </ThemeCard>
        </div>

        {/* 今日任务 */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📝</span>
            今日任务
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-semibold text-gray-800">完成作业</p>
                  <p className="text-sm text-gray-600">已完成</p>
                </div>
              </div>
              <span className="text-green-600 font-bold">+10 积分</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4 border-gray-300">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <p className="font-semibold text-gray-800">整理房间</p>
                  <p className="text-sm text-gray-600">待完成</p>
                </div>
              </div>
              <span className="text-gray-600 font-bold">+5 积分</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4 border-gray-300">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <p className="font-semibold text-gray-800">户外运动</p>
                  <p className="text-sm text-gray-600">待完成</p>
                </div>
              </div>
              <span className="text-gray-600 font-bold">+8 积分</span>
            </div>
          </div>
        </div>

        {/* 我的勋章预览 */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">🏆</span>
            我的勋章收藏
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg">
              <div className="text-4xl mb-2">🌟</div>
              <p className="font-semibold text-gray-800">学习之星</p>
              <p className="text-xs text-gray-600">进度: 2/3</p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
              <div className="text-4xl mb-2">🏠</div>
              <p className="font-semibold text-gray-800">独立能手</p>
              <p className="text-xs text-gray-600">进度: 1/3</p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
              <div className="text-4xl mb-2">⚽</div>
              <p className="font-semibold text-gray-800">运动之星</p>
              <p className="text-xs text-gray-600">进度: 0/3</p>
            </div>

            <div className="text-center p-4 bg-gray-100 rounded-lg opacity-50">
              <div className="text-4xl mb-2">🔒</div>
              <p className="font-semibold text-gray-600">未解锁</p>
              <p className="text-xs text-gray-500">继续努力</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
