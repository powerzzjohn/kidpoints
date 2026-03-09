import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useTheme } from '../../contexts/ThemeContext';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  points: number;
  type: string;
  category: string;
  image: string | null;
  isActive: boolean;
  stock: number | null;
}

export default function ShopManagement() {
  const { themeConfig } = useTheme();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    points: '',
    type: 'PHYSICAL',
    category: '',
    image: '',
    stock: ''
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/shop/items?includeInactive=true');
      setItems(res.data.items);
    } catch (error) {
      console.error('加载商品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.points || !formData.category) {
      alert('请填写所有必填项');
      return;
    }

    try {
      const data = {
        ...formData,
        points: parseInt(formData.points),
        stock: formData.stock ? parseInt(formData.stock) : null,
        image: formData.image || null
      };

      if (editingItem) {
        await api.put(`/api/shop/items/${editingItem.id}`, data);
      } else {
        await api.post('/api/shop/items', data);
      }

      setShowForm(false);
      setEditingItem(null);
      resetForm();
      await loadItems();
      alert(editingItem ? '商品更新成功！' : '商品创建成功！');
    } catch (error: any) {
      console.error('操作失败:', error);
      alert(error.response?.data?.message || '操作失败，请重试');
    }
  };

  const handleEdit = (item: ShopItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      points: item.points.toString(),
      type: item.type,
      category: item.category,
      image: item.image || '',
      stock: item.stock?.toString() || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个商品吗？')) return;

    try {
      await api.delete(`/api/shop/items/${id}`);
      await loadItems();
      alert('商品删除成功！');
    } catch (error: any) {
      console.error('删除失败:', error);
      alert(error.response?.data?.message || '删除失败，请重试');
    }
  };

  const toggleActive = async (item: ShopItem) => {
    try {
      await api.put(`/api/shop/items/${item.id}`, {
        isActive: !item.isActive
      });
      await loadItems();
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
      type: 'PHYSICAL',
      category: '',
      image: '',
      stock: ''
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-purple-800 mb-2">🏪 商城管理</h1>
            <p className="text-gray-600">管理积分商城的商品</p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingItem(null);
              resetForm();
            }}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-bold transition"
          >
            {showForm ? '取消' : '+ 添加商品'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingItem ? '编辑商品' : '添加新商品'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">商品名称 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：玩具汽车"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">所需积分 *</label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                    placeholder="例如：50"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">商品类型 *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="PHYSICAL">实物商品</option>
                    <option value="VIRTUAL">虚拟奖励</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">分类 *</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="例如：玩具、零食、特权"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">库存数量</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="留空表示无限库存"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">图片链接</label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="商品图片URL（可选）"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">商品描述 *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="详细描述商品内容"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-bold transition"
                >
                  {editingItem ? '保存修改' : '添加商品'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl shadow-lg p-12 text-center text-gray-500">
              <div className="text-6xl mb-4">🏪</div>
              <div className="text-xl">还没有商品</div>
              <div className="text-sm mt-2">点击上方按钮添加第一个商品</div>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
                <div className="h-40 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl">🎁</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-800">{item.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.isActive ? '上架' : '下架'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-purple-600">{item.points} 积分</span>
                    {item.stock !== null && (
                      <span className="text-xs text-gray-500">库存: {item.stock}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(item)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                        item.isActive
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {item.isActive ? '下架' : '上架'}
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
