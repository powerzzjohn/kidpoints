import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireParent, AuthRequest } from '../middleware/auth';
import NotificationService from '../utils/notifications';

const router = Router();
const prisma = new PrismaClient();

// 获取勋章模板列表
router.get('/templates', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const badges = await prisma.badge.findMany({
      where: {
        OR: [
          { familyId: null }, // 系统预设勋章
          { familyId: req.user!.familyId } // 家庭自定义勋章
        ]
      },
      orderBy: [
        { familyId: 'asc' }, // 系统勋章在前
        { createdAt: 'desc' }
      ]
    });

    res.json({ badges });
  } catch (error) {
    console.error('获取勋章模板失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '获取勋章模板失败' });
  }
});

// 获取用户的勋章（包含进度）
router.get('/user/:userId?', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.params.userId || req.user!.id;
    
    // 验证权限
    if (userId !== req.user!.id) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.familyId !== req.user!.familyId) {
        res.status(403).json({ error: 'FORBIDDEN', message: '无权查看此用户勋章' });
        return;
      }
    }

    // 获取用户已获得的勋章
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true
      },
      orderBy: { earnedAt: 'desc' }
    });

    // 获取所有可用的勋章模板
    const allBadges = await prisma.badge.findMany({
      where: {
        OR: [
          { familyId: null },
          { familyId: req.user!.familyId }
        ]
      }
    });

    // 计算每个勋章的进度
    const badgesWithProgress = await Promise.all(
      allBadges.map(async (badge) => {
        const userBadge = userBadges.find(ub => ub.badgeId === badge.id);
        
        if (userBadge) {
          // 已获得
          return {
            ...badge,
            earned: true,
            earnedAt: userBadge.earnedAt,
            progress: 100
          };
        }

        // 未获得，计算进度
        const condition = JSON.parse(badge.condition);
        const { ruleId, count, period } = condition;

        // 计算时间范围
        const now = new Date();
        let startDate = new Date();
        if (period === 'week') {
          startDate.setDate(now.getDate() - 7);
        } else if (period === 'month') {
          startDate.setMonth(now.getMonth() - 1);
        }

        // 统计完成次数
        const completedCount = await prisma.pointsRecord.count({
          where: {
            userId,
            ruleId,
            type: 'EARN',
            createdAt: { gte: startDate }
          }
        });

        const progress = Math.min(Math.round((completedCount / count) * 100), 100);

        return {
          ...badge,
          earned: false,
          progress,
          currentCount: completedCount,
          targetCount: count
        };
      })
    );

    res.json({ badges: badgesWithProgress });
  } catch (error) {
    console.error('获取用户勋章失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '获取用户勋章失败' });
  }
});

// 创建自定义勋章（家长专用）
router.post('/templates', authenticate, requireParent, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { name, description, icon, category, ruleId, count, period } = req.body;

    if (!name || !description || !icon || !ruleId || !count || !period) {
      res.status(400).json({ error: 'BAD_REQUEST', message: '缺少必填字段' });
      return;
    }

    // 验证规则是否存在且属于同一家庭
    const rule = await prisma.behaviorRule.findUnique({
      where: { id: ruleId }
    });

    if (!rule || rule.familyId !== req.user!.familyId) {
      res.status(400).json({ error: 'BAD_REQUEST', message: '规则不存在或不属于当前家庭' });
      return;
    }

    const badge = await prisma.badge.create({
      data: {
        name,
        description,
        icon,
        category: category || 'CUSTOM',
        condition: JSON.stringify({ ruleId, count, period }),
        familyId: req.user!.familyId
      }
    });

    res.json(badge);
  } catch (error) {
    console.error('创建勋章失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '创建勋章失败' });
  }
});

// 删除自定义勋章（家长专用）
router.delete('/templates/:id', authenticate, requireParent, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { id } = req.params;

    const badge = await prisma.badge.findUnique({
      where: { id }
    });

    if (!badge) {
      res.status(404).json({ error: 'NOT_FOUND', message: '勋章不存在' });
      return;
    }

    // 只能删除自己家庭的自定义勋章
    if (!badge.familyId || badge.familyId !== req.user!.familyId) {
      res.status(403).json({ error: 'FORBIDDEN', message: '无权删除此勋章' });
      return;
    }

    await prisma.badge.delete({
      where: { id }
    });

    res.json({ message: '勋章已删除' });
  } catch (error) {
    console.error('删除勋章失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '删除勋章失败' });
  }
});

// 手动颁发勋章（家长专用）
router.post('/award', authenticate, requireParent, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { userId, badgeId } = req.body;

    if (!userId || !badgeId) {
      res.status(400).json({ error: 'BAD_REQUEST', message: '缺少必填字段' });
      return;
    }

    // 验证用户和勋章
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const badge = await prisma.badge.findUnique({ where: { id: badgeId } });

    if (!user || user.familyId !== req.user!.familyId) {
      res.status(400).json({ error: 'BAD_REQUEST', message: '用户不存在或不属于当前家庭' });
      return;
    }

    if (!badge) {
      res.status(404).json({ error: 'NOT_FOUND', message: '勋章不存在' });
      return;
    }

    // 检查是否已获得
    const existing = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId
        }
      }
    });

    if (existing) {
      res.status(400).json({ error: 'BAD_REQUEST', message: '用户已获得此勋章' });
      return;
    }

    // 颁发勋章
    const userBadge = await prisma.userBadge.create({
      data: {
        userId,
        badgeId,
        progress: 100
      },
      include: {
        badge: true
      }
    });

    // 发送勋章获得通知
    NotificationService.sendBadgeEarned(user.familyId, {
      userId: user.id,
      username: user.username,
      badgeName: badge.name,
      badgeIcon: badge.icon,
      badgeId: badge.id
    });

    res.json(userBadge);
  } catch (error) {
    console.error('颁发勋章失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '颁发勋章失败' });
  }
});

// 检查并自动颁发勋章
router.post('/check-and-award/:userId', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { userId } = req.params;

    // 验证权限
    if (userId !== req.user!.id && req.user!.role !== 'PARENT') {
      res.status(403).json({ error: 'FORBIDDEN', message: '无权操作' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.familyId !== req.user!.familyId) {
      res.status(403).json({ error: 'FORBIDDEN', message: '用户不存在或不属于当前家庭' });
      return;
    }

    // 获取所有勋章模板
    const badges = await prisma.badge.findMany({
      where: {
        OR: [
          { familyId: null },
          { familyId: user.familyId }
        ]
      }
    });

    const newlyEarnedBadges = [];

    for (const badge of badges) {
      // 检查是否已获得
      const existing = await prisma.userBadge.findUnique({
        where: {
          userId_badgeId: {
            userId,
            badgeId: badge.id
          }
        }
      });

      if (existing) continue;

      // 检查是否满足条件
      const condition = JSON.parse(badge.condition);
      const { ruleId, count, period } = condition;

      const now = new Date();
      let startDate = new Date();
      if (period === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      }

      const completedCount = await prisma.pointsRecord.count({
        where: {
          userId,
          ruleId,
          type: 'EARN',
          createdAt: { gte: startDate }
        }
      });

      if (completedCount >= count) {
        // 自动颁发勋章
        const userBadge = await prisma.userBadge.create({
          data: {
            userId,
            badgeId: badge.id,
            progress: 100
          },
          include: {
            badge: true
          }
        });
        newlyEarnedBadges.push(userBadge);

        // 发送勋章获得通知
        NotificationService.sendBadgeEarned(user.familyId, {
          userId: user.id,
          username: user.username,
          badgeName: badge.name,
          badgeIcon: badge.icon,
          badgeId: badge.id
        });
      }
    }

    res.json({ 
      message: '检查完成',
      newBadges: newlyEarnedBadges,
      count: newlyEarnedBadges.length
    });
  } catch (error) {
    console.error('检查勋章失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '检查勋章失败' });
  }
});

export default router;
