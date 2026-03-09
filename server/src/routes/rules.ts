import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireParent, AuthRequest } from '../middleware/auth';
import NotificationService from '../utils/notifications';

const router = Router();
const prisma = new PrismaClient();

// 获取家庭规则列表
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { includeInactive = 'false' } = req.query;
    
    const rules = await prisma.behaviorRule.findMany({
      where: {
        familyId: req.user!.familyId,
        ...(includeInactive === 'false' ? { isActive: true } : {})
      },
      include: {
        createdBy: {
          select: { id: true, username: true }
        },
        confirmations: {
          include: {
            user: {
              select: { id: true, username: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ rules });
  } catch (error) {
    console.error('获取规则列表失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '获取规则列表失败' });
  }
});

// 获取单个规则详情
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const rule = await prisma.behaviorRule.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, username: true }
        },
        confirmations: {
          include: {
            user: {
              select: { id: true, username: true }
            }
          }
        }
      }
    });

    if (!rule || rule.familyId !== req.user!.familyId) {
      return res.status(404).json({ error: 'NOT_FOUND', message: '规则不存在' });
    }

    res.json({ rule });
  } catch (error) {
    console.error('获取规则详情失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '获取规则详情失败' });
  }
});

// 创建规则（家长专用）
router.post('/', authenticate, requireParent, async (req: AuthRequest, res) => {
  try {
    const { name, description, points, category, effectiveDate } = req.body;

    if (!name || !description || points === undefined || !category || !effectiveDate) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: '缺少必要参数' });
    }

    const validCategories = ['STUDY', 'CHORES', 'EXERCISE', 'BEHAVIOR'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: '无效的规则类别' });
    }

    const rule = await prisma.behaviorRule.create({
      data: {
        familyId: req.user!.familyId,
        name,
        description,
        points,
        category,
        effectiveDate: new Date(effectiveDate),
        createdById: req.user!.id,
        isActive: false // 新规则默认未激活，需要儿童确认
      },
      include: {
        createdBy: {
          select: { id: true, username: true }
        }
      }
    });

    res.json({ rule });
  } catch (error) {
    console.error('创建规则失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '创建规则失败' });
  }
});

// 更新规则（家长专用）
router.put('/:id', authenticate, requireParent, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, description, points, category, effectiveDate, isActive } = req.body;

    // 验证规则是否存在且属于当前家庭
    const existingRule = await prisma.behaviorRule.findUnique({ where: { id } });
    if (!existingRule || existingRule.familyId !== req.user!.familyId) {
      return res.status(404).json({ error: 'NOT_FOUND', message: '规则不存在' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (points !== undefined) updateData.points = points;
    if (category !== undefined) {
      const validCategories = ['STUDY', 'CHORES', 'EXERCISE', 'BEHAVIOR'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: 'INVALID_INPUT', message: '无效的规则类别' });
      }
      updateData.category = category;
    }
    if (effectiveDate !== undefined) updateData.effectiveDate = new Date(effectiveDate);
    if (isActive !== undefined) updateData.isActive = isActive;

    const rule = await prisma.behaviorRule.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, username: true }
        },
        confirmations: {
          include: {
            user: {
              select: { id: true, username: true }
            }
          }
        }
      }
    });

    res.json({ rule });
  } catch (error) {
    console.error('更新规则失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '更新规则失败' });
  }
});

// 删除规则（家长专用）
router.delete('/:id', authenticate, requireParent, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // 验证规则是否存在且属于当前家庭
    const existingRule = await prisma.behaviorRule.findUnique({ where: { id } });
    if (!existingRule || existingRule.familyId !== req.user!.familyId) {
      return res.status(404).json({ error: 'NOT_FOUND', message: '规则不存在' });
    }

    await prisma.behaviorRule.delete({ where: { id } });

    res.json({ message: '规则已删除' });
  } catch (error) {
    console.error('删除规则失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '删除规则失败' });
  }
});

// 儿童确认规则
router.post('/:id/confirm', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // 验证规则是否存在且属于当前家庭
    const rule = await prisma.behaviorRule.findUnique({ where: { id } });
    if (!rule || rule.familyId !== req.user!.familyId) {
      return res.status(404).json({ error: 'NOT_FOUND', message: '规则不存在' });
    }

    // 检查是否已确认
    const existingConfirmation = await prisma.ruleConfirmation.findUnique({
      where: {
        ruleId_userId: {
          ruleId: id,
          userId: req.user!.id
        }
      }
    });

    if (existingConfirmation) {
      return res.status(400).json({ error: 'ALREADY_CONFIRMED', message: '已经确认过此规则' });
    }

    // 创建确认记录
    const confirmation = await prisma.ruleConfirmation.create({
      data: {
        ruleId: id,
        userId: req.user!.id
      }
    });

    // 检查是否所有儿童都已确认，如果是则激活规则
    const children = await prisma.user.findMany({
      where: {
        familyId: req.user!.familyId,
        role: 'CHILD'
      }
    });

    const confirmations = await prisma.ruleConfirmation.findMany({
      where: { ruleId: id }
    });

    if (confirmations.length === children.length) {
      await prisma.behaviorRule.update({
        where: { id },
        data: { isActive: true }
      });
    }

    // 发送规则确认通知
    NotificationService.sendRuleConfirmation(req.user!.familyId, {
      userId: req.user!.id,
      username: req.user!.username,
      ruleName: rule.name,
      ruleId: rule.id,
      points: rule.points
    });

    res.json({ confirmation, message: '规则确认成功' });
  } catch (error) {
    console.error('确认规则失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '确认规则失败' });
  }
});

// 获取待确认的规则（儿童视角）
router.get('/pending/confirmations', authenticate, async (req: AuthRequest, res) => {
  try {
    // 获取所有未激活的规则
    const allRules = await prisma.behaviorRule.findMany({
      where: {
        familyId: req.user!.familyId,
        isActive: false
      },
      include: {
        createdBy: {
          select: { id: true, username: true }
        },
        confirmations: true
      }
    });

    // 过滤出当前用户未确认的规则
    const pendingRules = allRules.filter(rule => 
      !rule.confirmations.some(c => c.userId === req.user!.id)
    );

    res.json({ rules: pendingRules });
  } catch (error) {
    console.error('获取待确认规则失败:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '获取待确认规则失败' });
  }
});

export default router;
