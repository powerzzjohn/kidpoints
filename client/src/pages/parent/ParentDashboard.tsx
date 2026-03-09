import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeCard from '../../components/theme/ThemeCard';

interface Child {
  id: string;
  username: string;
  avatar?: string;
  theme: string;
  relation: string;
  isPrimary: boolean;
}

export default function ParentDashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const { themeConfig } = useTheme();
  const [myChildren, setMyChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyChildren();
  }, []);

  const loadMyChildren = async () => {
    try {
      const response = await api.get('/api/family/my-children');
      setMyChildren(response.data);
    } catch (error) {
      console.error('加载孩子列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRelationText = (relation: string) => {
    const map: Record<string, string> = {
      father: '父亲',
      mother: '母亲',
      guardian: '监护人',
      parent: '家长'
    };
    return map[relation] || relation;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">👨‍👩‍👧</span>
              <h1 className="text-xl font-bold text-gray-800">家长控制台</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">欢迎, {user?.username}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 我的孩子列表 */}
        {myChildren.length > 0 && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">👶</span>
              我的孩子
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myChildren.map((child) => (
                <div
                  key={child.id}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-purple-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {child.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{child.username}</p>
                      <p className="text-sm text-gray-600">
                        {getRelationText(child.relation)}
                        {child.isPrimary && ' · 主要监护人'}
                      </p>
                      <p className="text-xs text-gray-500">
                        主题: {child.theme === 'PVZ' ? '🌻 植物大战僵尸' : '⛏️ 我的世界'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 功能卡片 */}
          <ThemeCard 
            onClick={() => navigate('/parent/rules')}
            icon="📋"
            title="行为规则管理"
          >
            <p className="text-gray-600">创建和管理儿童的行为规则，设置积分奖惩</p>
          </ThemeCard>

          <ThemeCard 
            onClick={() => navigate('/parent/shop')}
            icon="🏪"
            title="积分商城管理"
          >
            <p className="text-gray-600">管理商城商品，设置兑换积分和库存</p>
          </ThemeCard>

          <ThemeCard 
            onClick={() => navigate('/parent/points')}
            icon="⭐"
            title="积分操作"
          >
            <p className="text-gray-600">给儿童加分或减分，查看积分历史</p>
          </ThemeCard>

          <ThemeCard 
            onClick={() => navigate('/parent/redemptions')}
            icon="🎁"
            title="兑换审批"
          >
            <p className="text-gray-600">处理儿童的礼品兑换申请</p>
          </ThemeCard>

          <ThemeCard 
            onClick={() => navigate('/parent/badges')}
            icon="🏅"
            title="勋章管理"
          >
            <p className="text-gray-600">创建自定义勋章，查看儿童成就</p>
          </ThemeCard>

          <ThemeCard 
            icon="⚙️"
            title="系统设置"
          >
            <p className="text-gray-600">自定义文案、上传家庭照片</p>
          </ThemeCard>

          <ThemeCard 
            onClick={() => navigate('/test-notifications')}
            icon="🔔"
            title="通知测试"
          >
            <p className="text-gray-600">测试实时通知和Socket连接功能</p>
          </ThemeCard>

          <ThemeCard 
            onClick={() => navigate('/leaderboard')}
            icon="🏆"
            title="积分排行榜"
          >
            <p className="text-gray-600">查看家庭成员积分排名</p>
          </ThemeCard>
        </div>

        {/* 快速统计 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
            <div className="text-3xl mb-2">👶</div>
            <div className="text-2xl font-bold">1</div>
            <div className="text-blue-100">家庭成员</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
            <div className="text-3xl mb-2">📋</div>
            <div className="text-2xl font-bold">3</div>
            <div className="text-green-100">活跃规则</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6">
            <div className="text-3xl mb-2">🏪</div>
            <div className="text-2xl font-bold">5</div>
            <div className="text-purple-100">商城商品</div>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-xl p-6">
            <div className="text-3xl mb-2">🎁</div>
            <div className="text-2xl font-bold">0</div>
            <div className="text-pink-100">待审批</div>
          </div>
        </div>
      </div>
    </div>
  );
}
