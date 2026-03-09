import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  points: number;
  type: string;
  category: string;
  image: string | null;
  stock: number | null;
}

export default function Shop() {
  const navigate = useNavigate();
  const { themeConfig } = useTheme();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsRes, balanceRes] = await Promise.all([
        api.get('/api/shop/items'),
        api.get('/api/points/balance')
      ]);
      setItems(itemsRes.data.items);
      setBalance(balanceRes.data.balance);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (item: ShopItem) => {
    if (balance < item.points) {
      alert('积分不足，继续努力吧！');
      return;
    }

    if (item.stock !== null && item.stock <= 0) {
      alert('商品已售罄');
      return;
    }

    if (!confirm(`确定要兑换 ${item.name} 吗？\n需要消耗 ${item.points} 积分`)) {
      return;
    }

    try {
      await api.post('/api/redemptions', { itemId: item.id });
      alert('兑换申请已提交！\n请等待家长审批');
      setSelectedItem(null);
      await loadData();
    } catch (error: any) {
      console.error('兑换失败:', error);
      alert(error.response?.data?.message || '兑换失败，请重试');
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/child/dashboard')}
            className="mb-4 text-purple-600 hover:text-purple-800 font-medium"
          >
            ← 返回首页
          </button>
          <h1 className="text-3xl font-bold text-purple-800 mb-2">🏪 积分商城</h1>
          <p className="text-gray-600">用积分兑换心仪的礼物</p>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 mb-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90 mb-1">我的积分</div>
              <div className="text-4xl font-bold">{balance}</div>
            </div>
            <button
              onClick={() => navigate('/child/redemptions')}
              className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg font-bold transition"
            >
              查看兑换记录
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl shadow-lg p-12 text-center text-gray-500">
              <div className="text-6xl mb-4">🏪</div>
              <div className="text-xl">商城暂时没有商品</div>
              <div className="text-sm mt-2">请等待家长添加商品</div>
            </div>
          ) : (
            items.map((item) => {
              const canAfford = balance >= item.points;
              const outOfStock = item.stock !== null && item.stock <= 0;
              
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition ${
                    !canAfford || outOfStock ? 'opacity-60' : ''
                  }`}
                >
                  <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center relative">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-7xl">🎁</span>
                    )}
                    {outOfStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">已售罄</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-purple-600">{item.points} 积分</span>
                      {item.stock !== null && (
                        <span className="text-xs text-gray-500">剩余: {item.stock}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRedeem(item)}
                      disabled={!canAfford || outOfStock}
                      className={`w-full py-3 rounded-lg font-bold transition ${
                        canAfford && !outOfStock
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {outOfStock ? '已售罄' : canAfford ? '立即兑换' : '积分不足'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
