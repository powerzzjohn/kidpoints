import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireParent, AuthRequest } from '../middleware/auth';
import NotificationService from '../utils/notifications';

const router = Router();
const prisma = new PrismaClient();

// 获取用户积分总额
router.get('/balance/:userId?', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.userId || req.user!.id;
    
    // 如果查询其他用户的积分，需要是同一家庭
    if (userId !== req.user!.id) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.familyId !== req.user!.familyId) {
        return res.status(403).json({ error: 'FORBIDDEN', message: '无权查看此用户积分' });
      }
    }

    const records = await prisma.pointsRecord.findMany({
      where: { userId }
    });

    const balance = records.reduce((sum, record) => sum + record.amount, 0);

    res.json({ userId, balance });
  } catch (error) {
    console.error('获取积分余额失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '获取积分余额失败' });
  }
});

// 获取积分记录列表
router.get('/records/:userId?', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.userId || req.user!.id;
    const { limit = '50', offset = '0' } = req.query;
    
    // 如果查询其他用户的记录，需要是同一家庭
    if (userId !== req.user!.id) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.familyId !== req.user!.familyId) {
        return res.status(403).json({ error: 'FORBIDDEN', message: '无权查看此用户记录' });
      }
    }

    const records = await prisma.pointsRecord.findMany({
      where: { userId },
      include: {
        rule: true,
        createdBy: {
          select: { id: true, username: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    const total = await prisma.pointsRecord.count({ where: { userId } });

    res.json({ records, total });
  } catch (error) {
    console.error('获取积分记录失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '获取积分记录失败' });
  }
});

// 添加积分（家长专用）
router.post('/add', authenticate, requireParent, async (req: AuthRequest, res) => {
  try {
    const { userId, amount, reason, ruleId } = req.body;

    if (!userId || !amount || !reason) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: '缺少必要参数' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: '积分数量必须大于0' });
    }

    // 验证目标用户是否在同一家庭
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser || targetUser.familyId !== req.user!.familyId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: '无权操作此用户' });
    }

    // 如果提供了规则ID，验证规则
    if (ruleId) {
      const rule = await prisma.behaviorRule.findUnique({ where: { id: ruleId } });
      if (!rule || rule.familyId !== req.user!.familyId) {
        return res.status(400).json({ error: 'INVALID_INPUT', message: '无效的规则ID' });
      }
    }

    const record = await prisma.pointsRecord.create({
      data: {
        userId,
        amount,
        type: 'EARN',
        reason,
        ruleId: ruleId || null,
        createdById: req.user!.id
      },
      include: {
        rule: true,
        createdBy: {
          select: { id: true, username: true, role: true }
        }
      }
    });

    // 获取用户当前余额
    const records = await prisma.pointsRecord.findMany({ where: { userId } });
    const balance = records.reduce((sum, record) => sum + record.amount, 0);

    // 发送积分变化通知
    NotificationService.sendPointsChange(targetUser.familyId, {
      userId: targetUser.id,
      username: targetUser.username,
      amount,
      reason,
      balance,
      type: 'earn'
    });

    res.json({ record });
  } catch (error) {
    console.error('添加积分失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '添加积分失败' });
  }
});

// 扣除积分（家长专用）
router.post('/deduct', authenticate, requireParent, async (req: AuthRequest, res) => {
  try {
    const { userId, amount, reason } = req.body;

    if (!userId || !amount || !reason) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: '缺少必要参数' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: '积分数量必须大于0' });
    }

    // 验证目标用户是否在同一家庭
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser || targetUser.familyId !== req.user!.familyId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: '无权操作此用户' });
    }

    // 检查积分余额
    const records = await prisma.pointsRecord.findMany({ where: { userId } });
    const balance = records.reduce((sum, record) => sum + record.amount, 0);

    if (balance < amount) {
      return res.status(400).json({ error: 'INSUFFICIENT_POINTS', message: '积分余额不足' });
    }

    const record = await prisma.pointsRecord.create({
      data: {
        userId,
        amount: -amount,
        type: 'SPEND',
        reason,
        createdById: req.user!.id
      },
      include: {
        createdBy: {
          select: { id: true, username: true, role: true }
        }
      }
    });

    // 获取用户当前余额
    const updatedRecords = await prisma.pointsRecord.findMany({ where: { userId } });
    const newBalance = updatedRecords.reduce((sum, record) => sum + record.amount, 0);

    // 发送积分变化通知
    NotificationService.sendPointsChange(targetUser.familyId, {
      userId: targetUser.id,
      username: targetUser.username,
      amount: -amount,
      reason,
      balance: newBalance,
      type: 'spend'
    });

    res.json({ record });
  } catch (error) {
    console.error('扣除积分失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '扣除积分失败' });
  }
});

// 获取家庭成员列表（用于选择操作对象）
router.get('/family-members', authenticate, async (req: AuthRequest, res) => {
  try {
    // 如果是家长，优先显示有关系的儿童
    if (req.user!.role === 'PARENT') {
      // 获取有关系的儿童
      const relations = await prisma.parentChildRelation.findMany({
        where: { parentId: req.user!.id },
        include: {
          child: {
            select: {
              id: true,
              username: true,
              avatar: true,
              role: true,
              theme: true
            }
          }
        },
        orderBy: { isPrimary: 'desc' }
      });

      const myChildren = relations.map(rel => ({
        ...rel.child,
        relation: rel.relation,
        isPrimary: rel.isPrimary,
        hasRelation: true
      }));

      // 获取家庭内其他儿童（没有关系的）
      const myChildrenIds = myChildren.map(c => c.id);
      const otherChildren = await prisma.user.findMany({
        where: {
          familyId: req.user!.familyId,
          role: 'CHILD',
          id: { notIn: myChildrenIds }
        },
        select: {
          id: true,
          username: true,
          avatar: true,
          role: true,
          theme: true
        }
      });

      const otherChildrenWithFlag = otherChildren.map(child => ({
        ...child,
        hasRelation: false
      }));

      // 合并列表，有关系的在前
      const members = [...myChildren, ...otherChildrenWithFlag];

      res.json({ members, myChildrenCount: myChildren.length });
    } else {
      // 儿童用户，返回所有家庭成员
      const members = await prisma.user.findMany({
        where: { 
          familyId: req.user!.familyId
        },
        select: {
          id: true,
          username: true,
          avatar: true,
          role: true
        }
      });

      res.json({ members });
    }
  } catch (error) {
    console.error('获取家庭成员失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '获取家庭成员失败' });
  }
});

export default router;
