import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireParent, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 获取商城商品列表
router.get('/items', authenticate, async (req: AuthRequest, res) => {
  try {
    const { includeInactive = 'false' } = req.query;
    
    const items = await prisma.shopItem.findMany({
      where: {
        familyId: req.user!.familyId,
        ...(includeInactive === 'false' ? { isActive: true } : {})
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ items });
  } catch (error) {
    console.error('获取商品列表失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '获取商品列表失败' });
  }
});

// 获取单个商品详情
router.get('/items/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const item = await prisma.shopItem.findUnique({
      where: { id }
    });

    if (!item || item.familyId !== req.user!.familyId) {
      return res.status(404).json({ error: 'NOT_FOUND', message: '商品不存在' });
    }

    res.json({ item });
  } catch (error) {
    console.error('获取商品详情失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '获取商品详情失败' });
  }
});

// 创建商品（家长专用）
router.post('/items', authenticate, requireParent, async (req: AuthRequest, res) => {
  try {
    const { name, description, points, type, category, image, stock } = req.body;

    if (!name || !description || !points || !type || !category) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: '缺少必要参数' });
    }

    const validTypes = ['PHYSICAL', 'VIRTUAL'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: '无效的商品类型' });
    }

    const item = await prisma.shopItem.create({
      data: {
        familyId: req.user!.familyId,
        name,
        description,
        points,
        type,
        category,
        image: image || null,
        stock: stock || null,
        isActive: true
      }
    });

    res.json({ item });
  } catch (error) {
    console.error('创建商品失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '创建商品失败' });
  }
});

// 更新商品（家长专用）
router.put('/items/:id', authenticate, requireParent, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, points, type, category, image, stock, isActive } = req.body;

    // 验证商品是否存在且属于当前家庭
    const existingItem = await prisma.shopItem.findUnique({ where: { id } });
    if (!existingItem || existingItem.familyId !== req.user!.familyId) {
      return res.status(404).json({ error: 'NOT_FOUND', message: '商品不存在' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (points !== undefined) updateData.points = points;
    if (type !== undefined) {
      const validTypes = ['PHYSICAL', 'VIRTUAL'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'INVALID_INPUT', message: '无效的商品类型' });
      }
      updateData.type = type;
    }
    if (category !== undefined) updateData.category = category;
    if (image !== undefined) updateData.image = image;
    if (stock !== undefined) updateData.stock = stock;
    if (isActive !== undefined) updateData.isActive = isActive;

    const item = await prisma.shopItem.update({
      where: { id },
      data: updateData
    });

    res.json({ item });
  } catch (error) {
    console.error('更新商品失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '更新商品失败' });
  }
});

// 删除商品（家长专用）
router.delete('/items/:id', authenticate, requireParent, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // 验证商品是否存在且属于当前家庭
    const existingItem = await prisma.shopItem.findUnique({ where: { id } });
    if (!existingItem || existingItem.familyId !== req.user!.familyId) {
      return res.status(404).json({ error: 'NOT_FOUND', message: '商品不存在' });
    }

    await prisma.shopItem.delete({ where: { id } });

    res.json({ message: '商品已删除' });
  } catch (error) {
    console.error('删除商品失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '删除商品失败' });
  }
});

export default router;
