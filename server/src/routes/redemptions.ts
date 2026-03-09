import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireParent, AuthRequest } from '../middleware/auth';
import NotificationService from '../utils/notifications';

const router = Router();
const prisma = new PrismaClient();

// 获取兑换记录列表
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { status, userId } = req.query;
    
    const where: any = {};
    
    // 如果是儿童，只能看自己的记录
    if (req.user!.role === 'CHILD') {
      where.userId = req.user!.id;
    } else {
      // 家长可以看所有家庭成员的记录
      const familyMembers = await prisma.user.findMany({
        where: { familyId: req.user!.familyId },
        select: { id: true }
      });
      where.userId = { in: familyMembers.map(m => m.id) };
      
      // 如果指定了用户ID，进一步过滤
      if (userId) {
        where.userId = userId;
      }
    }
    
    if (status) {
      where.status = status;
    }

    const redemptions = await prisma.redemptionRecord.findMany({
      where,
      include: {
        user: {
          select: { id: true, username: true, avatar: true }
        },
        item: true,
        processor: {
          select: { id: true, username: true }
        }
      },
      orderBy: { requestedAt: 'desc' }
    });

    res.json({ redemptions });
  } catch (error) {
    console.error('获取兑换记录失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '获取兑换记录失败' });
  }
});

// 创建兑换申请（儿童）
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: '缺少商品ID' });
    }

    // 验证商品是否存在
    const item = await prisma.shopItem.findUnique({ where: { id: itemId } });
    if (!item || item.familyId !== req.user!.familyId) {
      return res.status(404).json({ error: 'NOT_FOUND', message: '商品不存在' });
    }

    if (!item.isActive) {
      return res.status(400).json({ error: 'ITEM_INACTIVE', message: '商品已下架' });
    }

    // 检查库存
    if (item.stock !== null && item.stock <= 0) {
      return res.status(400).json({ error: 'OUT_OF_STOCK', message: '商品库存不足' });
    }

    // 检查积分余额
    const records = await prisma.pointsRecord.findMany({
      where: { userId: req.user!.id }
    });
    const balance = records.reduce((sum, record) => sum + record.amount, 0);

    if (balance < item.points) {
      return res.status(400).json({ error: 'INSUFFICIENT_POINTS', message: '积分不足' });
    }

    // 创建兑换申请
    const redemption = await prisma.redemptionRecord.create({
      data: {
        userId: req.user!.id,
        itemId,
        points: item.points,
        status: 'PENDING'
      },
      include: {
        user: {
          select: { id: true, username: true, avatar: true }
        },
        item: true
      }
    });

    // 发送兑换申请通知
    NotificationService.sendRedemptionRequested(req.user!.familyId, {
      userId: req.user!.id,
      username: req.user!.username,
      itemName: item.name,
      points: item.points,
      redemptionId: redemption.id,
      status: 'requested'
    });

    res.json({ redemption });
  } catch (error) {
    console.error('创建兑换申请失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '创建兑换申请失败' });
  }
});

// 处理兑换申请（家长专用）
router.put('/:id', authenticate, requireParent, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: '缺少状态参数' });
    }

    const validStatuses = ['APPROVED', 'REJECTED', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: '无效的状态' });
    }

    // 验证兑换记录是否存在
    const existingRedemption = await prisma.redemptionRecord.findUnique({
      where: { id },
      include: { user: true, item: true }
    });

    if (!existingRedemption) {
      return res.status(404).json({ error: 'NOT_FOUND', message: '兑换记录不存在' });
    }

    // 验证是否属于同一家庭
    if (existingRedemption.user.familyId !== req.user!.familyId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: '无权操作此记录' });
    }

    if (existingRedemption.status !== 'PENDING') {
      return res.status(400).json({ error: 'INVALID_STATUS', message: '该申请已被处理' });
    }

    // 如果批准，扣除积分并更新库存
    if (status === 'APPROVED' || status === 'COMPLETED') {
      // 扣除积分
      await prisma.pointsRecord.create({
        data: {
          userId: existingRedemption.userId,
          amount: -existingRedemption.points,
          type: 'SPEND',
          reason: `兑换商品: ${existingRedemption.item.name}`,
          createdById: req.user!.id
        }
      });

      // 更新库存
      if (existingRedemption.item.stock !== null) {
        await prisma.shopItem.update({
          where: { id: existingRedemption.itemId },
          data: { stock: existingRedemption.item.stock - 1 }
        });
      }
    }

    // 更新兑换记录
    const redemption = await prisma.redemptionRecord.update({
      where: { id },
      data: {
        status,
        notes: notes || null,
        processedAt: new Date(),
        processedBy: req.user!.id
      },
      include: {
        user: {
          select: { id: true, username: true, avatar: true }
        },
        item: true,
        processor: {
          select: { id: true, username: true }
        }
      }
    });

    // 发送兑换处理通知
    NotificationService.sendRedemptionProcessed(existingRedemption.user.familyId, {
      userId: existingRedemption.userId,
      username: existingRedemption.user.username,
      itemName: existingRedemption.item.name,
      points: existingRedemption.points,
      redemptionId: redemption.id,
      status: status.toLowerCase() as any
    });

    res.json({ redemption });
  } catch (error) {
    console.error('处理兑换申请失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '处理兑换申请失败' });
  }
});

// 获取待审批数量（家长）
router.get('/pending/count', authenticate, requireParent, async (req: AuthRequest, res) => {
  try {
    const familyMembers = await prisma.user.findMany({
      where: { familyId: req.user!.familyId },
      select: { id: true }
    });

    const count = await prisma.redemptionRecord.count({
      where: {
        userId: { in: familyMembers.map(m => m.id) },
        status: 'PENDING'
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('获取待审批数量失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '获取待审批数量失败' });
  }
});

export default router;
