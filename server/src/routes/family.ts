import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, requireParent } from '../middleware/auth';
import { upload, getFileUrl, deleteFile } from '../utils/upload';
import NotificationService from '../utils/notifications';

const router = Router();
const prisma = new PrismaClient();

// 获取家庭信息
router.get('/info', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const family = await prisma.family.findUnique({
      where: { id: req.user!.familyId },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            role: true,
            avatar: true,
            theme: true
          }
        }
      }
    });

    if (!family) {
      res.status(404).json({ error: 'NOT_FOUND', message: '家庭不存在' });
      return;
    }

    // 解析自定义文本
    let customTexts: Record<string, string> = {};
    try {
      customTexts = family.customTexts ? JSON.parse(family.customTexts) : {};
    } catch (error) {
      console.error('解析自定义文本失败:', error);
    }

    res.json({
      ...family,
      customTexts
    });
  } catch (error) {
    console.error('获取家庭信息错误:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '服务器内部错误' });
  }
});

// 更新家庭信息
router.put('/info', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { name, description, photo, customTexts } = req.body;

    const family = await prisma.family.update({
      where: { id: req.user!.familyId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(photo !== undefined && { photo }),
        ...(customTexts !== undefined && { customTexts: JSON.stringify(customTexts) })
      }
    });

    // 解析自定义文本
    let parsedCustomTexts: Record<string, string> = {};
    try {
      parsedCustomTexts = family.customTexts ? JSON.parse(family.customTexts) : {};
    } catch (error) {
      console.error('解析自定义文本失败:', error);
    }

    res.json({
      ...family,
      customTexts: parsedCustomTexts
    });
  } catch (error) {
    console.error('更新家庭信息错误:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '服务器内部错误' });
  }
});

// 获取我的孩子列表（家长专用）
router.get('/my-children', authenticate, requireParent, async (req: AuthRequest, res): Promise<void> => {
  try {
    const relations = await prisma.parentChildRelation.findMany({
      where: { parentId: req.user!.id },
      include: {
        child: {
          select: {
            id: true,
            username: true,
            avatar: true,
            theme: true,
            createdAt: true
          }
        }
      },
      orderBy: { isPrimary: 'desc' }
    });

    const children = relations.map(rel => ({
      ...rel.child,
      relation: rel.relation,
      isPrimary: rel.isPrimary
    }));

    res.json(children);
  } catch (error) {
    console.error('获取孩子列表错误:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '服务器内部错误' });
  }
});

// 获取我的家长列表（儿童专用）
router.get('/my-parents', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    if (req.user!.role !== 'CHILD') {
      res.status(403).json({ error: 'FORBIDDEN', message: '只有儿童可以查看家长列表' });
      return;
    }

    const relations = await prisma.parentChildRelation.findMany({
      where: { childId: req.user!.id },
      include: {
        parent: {
          select: {
            id: true,
            username: true,
            avatar: true,
            createdAt: true
          }
        }
      },
      orderBy: { isPrimary: 'desc' }
    });

    const parents = relations.map(rel => ({
      ...rel.parent,
      relation: rel.relation,
      isPrimary: rel.isPrimary
    }));

    res.json(parents);
  } catch (error) {
    console.error('获取家长列表错误:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '服务器内部错误' });
  }
});

// 添加父母-子女关系（家长专用）
router.post('/add-child', authenticate, requireParent, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { childId, relation = 'parent', isPrimary = false } = req.body;

    if (!childId) {
      res.status(400).json({ error: 'BAD_REQUEST', message: '缺少儿童ID' });
      return;
    }

    // 验证儿童是否存在且在同一家庭
    const child = await prisma.user.findUnique({
      where: { id: childId }
    });

    if (!child) {
      res.status(404).json({ error: 'NOT_FOUND', message: '儿童不存在' });
      return;
    }

    if (child.role !== 'CHILD') {
      res.status(400).json({ error: 'BAD_REQUEST', message: '目标用户不是儿童' });
      return;
    }

    if (child.familyId !== req.user!.familyId) {
      res.status(403).json({ error: 'FORBIDDEN', message: '只能添加同一家庭的儿童' });
      return;
    }

    // 检查关系是否已存在
    const existing = await prisma.parentChildRelation.findUnique({
      where: {
        parentId_childId: {
          parentId: req.user!.id,
          childId: childId
        }
      }
    });

    if (existing) {
      res.status(400).json({ error: 'BAD_REQUEST', message: '关系已存在' });
      return;
    }

    // 创建关系
    const newRelation = await prisma.parentChildRelation.create({
      data: {
        parentId: req.user!.id,
        childId: childId,
        relation: relation,
        isPrimary: isPrimary
      },
      include: {
        child: {
          select: {
            id: true,
            username: true,
            avatar: true,
            theme: true
          }
        }
      }
    });

    res.json(newRelation);
  } catch (error) {
    console.error('添加子女关系错误:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '服务器内部错误' });
  }
});

// 删除父母-子女关系（家长专用）
router.delete('/remove-child/:childId', authenticate, requireParent, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { childId } = req.params;

    const relation = await prisma.parentChildRelation.findUnique({
      where: {
        parentId_childId: {
          parentId: req.user!.id,
          childId: childId
        }
      }
    });

    if (!relation) {
      res.status(404).json({ error: 'NOT_FOUND', message: '关系不存在' });
      return;
    }

    await prisma.parentChildRelation.delete({
      where: {
        parentId_childId: {
          parentId: req.user!.id,
          childId: childId
        }
      }
    });

    res.json({ message: '关系已删除' });
  } catch (error) {
    console.error('删除子女关系错误:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '服务器内部错误' });
  }
});

// 更新关系信息（家长专用）
router.put('/update-relation/:childId', authenticate, requireParent, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { childId } = req.params;
    const { relation, isPrimary } = req.body;

    const existingRelation = await prisma.parentChildRelation.findUnique({
      where: {
        parentId_childId: {
          parentId: req.user!.id,
          childId: childId
        }
      }
    });

    if (!existingRelation) {
      res.status(404).json({ error: 'NOT_FOUND', message: '关系不存在' });
      return;
    }

    const updated = await prisma.parentChildRelation.update({
      where: {
        parentId_childId: {
          parentId: req.user!.id,
          childId: childId
        }
      },
      data: {
        ...(relation !== undefined && { relation }),
        ...(isPrimary !== undefined && { isPrimary })
      },
      include: {
        child: {
          select: {
            id: true,
            username: true,
            avatar: true,
            theme: true
          }
        }
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('更新关系错误:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '服务器内部错误' });
  }
});

// 获取家庭统计信息
router.get('/stats', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const familyId = req.user!.familyId;

    // 获取家庭成员统计
    const users = await prisma.user.findMany({
      where: { familyId },
      select: { id: true, role: true }
    });

    const parentCount = users.filter(u => u.role === 'PARENT').length;
    const childCount = users.filter(u => u.role === 'CHILD').length;

    // 获取活跃规则统计
    const activeRules = await prisma.behaviorRule.count({
      where: { 
        familyId,
        isActive: true,
        effectiveDate: { lte: new Date() }
      }
    });

    // 获取商城商品统计
    const shopItems = await prisma.shopItem.count({
      where: { familyId, isActive: true }
    });

    // 获取待审批兑换申请统计
    const pendingRedemptions = await prisma.redemptionRecord.count({
      where: { 
        user: { familyId },
        status: 'PENDING'
      }
    });

    // 获取积分总额统计
    const pointsRecords = await prisma.pointsRecord.findMany({
      where: { user: { familyId } }
    });

    const totalPointsEarned = pointsRecords
      .filter(r => r.amount > 0)
      .reduce((sum, r) => sum + r.amount, 0);

    const totalPointsSpent = pointsRecords
      .filter(r => r.amount < 0)
      .reduce((sum, r) => sum + Math.abs(r.amount), 0);

    // 获取勋章统计
    const badges = await prisma.userBadge.count({
      where: { user: { familyId } }
    });

    res.json({
      members: {
        total: users.length,
        parents: parentCount,
        children: childCount
      },
      rules: {
        active: activeRules
      },
      shop: {
        activeItems: shopItems
      },
      redemptions: {
        pending: pendingRedemptions
      },
      points: {
        totalEarned: totalPointsEarned,
        totalSpent: totalPointsSpent,
        currentBalance: totalPointsEarned - totalPointsSpent
      },
      badges: {
        earned: badges
      }
    });
  } catch (error) {
    console.error('获取家庭统计信息错误:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '服务器内部错误' });
  }
});

// 上传家庭照片
router.post('/upload-photo', authenticate, upload.single('photo'), async (req: AuthRequest, res): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'BAD_REQUEST', message: '请选择要上传的照片' });
      return;
    }

    // 获取当前家庭信息
    const family = await prisma.family.findUnique({
      where: { id: req.user!.familyId }
    });

    if (!family) {
      res.status(404).json({ error: 'NOT_FOUND', message: '家庭不存在' });
      return;
    }

    // 如果有旧照片，删除它
    if (family.photo) {
      const oldFilename = family.photo.split('/').pop();
      if (oldFilename) {
        deleteFile(oldFilename);
      }
    }

    // 更新家庭照片
    const photoUrl = getFileUrl(req.file.filename);
    const updatedFamily = await prisma.family.update({
      where: { id: req.user!.familyId },
      data: { photo: photoUrl }
    });

    // 发送家庭照片更新通知
    NotificationService.sendFamilyPhotoUpdated(req.user!.familyId, {
      userId: req.user!.id,
      username: req.user!.username,
      photoUrl: photoUrl
    });

    // 解析自定义文本
    let parsedCustomTexts: Record<string, string> = {};
    try {
      parsedCustomTexts = updatedFamily.customTexts ? JSON.parse(updatedFamily.customTexts) : {};
    } catch (error) {
      console.error('解析自定义文本失败:', error);
    }

    res.json({
      ...updatedFamily,
      customTexts: parsedCustomTexts,
      message: '照片上传成功'
    });
  } catch (error) {
    console.error('上传家庭照片错误:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '服务器内部错误' });
  }
});

// 删除家庭照片
router.delete('/photo', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const family = await prisma.family.findUnique({
      where: { id: req.user!.familyId }
    });

    if (!family) {
      res.status(404).json({ error: 'NOT_FOUND', message: '家庭不存在' });
      return;
    }

    if (!family.photo) {
      res.status(400).json({ error: 'BAD_REQUEST', message: '没有照片可删除' });
      return;
    }

    // 删除文件
    const filename = family.photo.split('/').pop();
    if (filename) {
      deleteFile(filename);
    }

    // 更新数据库
    const updatedFamily = await prisma.family.update({
      where: { id: req.user!.familyId },
      data: { photo: null }
    });

    // 解析自定义文本
    let parsedCustomTexts: Record<string, string> = {};
    try {
      parsedCustomTexts = updatedFamily.customTexts ? JSON.parse(updatedFamily.customTexts) : {};
    } catch (error) {
      console.error('解析自定义文本失败:', error);
    }

    res.json({
      ...updatedFamily,
      customTexts: parsedCustomTexts,
      message: '照片删除成功'
    });
  } catch (error) {
    console.error('删除家庭照片错误:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '服务器内部错误' });
  }
});

// 获取家庭自定义文本模板
router.get('/custom-texts/templates', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const templates = {
      welcomeMessage: {
        label: '欢迎消息',
        description: '在仪表板顶部显示的欢迎消息',
        defaultValue: '欢迎来到我们的积分世界！',
        placeholder: '输入欢迎消息...'
      },
      encouragementText: {
        label: '鼓励文本',
        description: '在儿童完成任务时显示的鼓励文本',
        defaultValue: '你真棒！继续加油！',
        placeholder: '输入鼓励文本...'
      },
      shopWelcome: {
        label: '商城欢迎语',
        description: '在商城页面显示的欢迎语',
        defaultValue: '用你的积分兑换心仪的礼物吧！',
        placeholder: '输入商城欢迎语...'
      },
      ruleConfirmationText: {
        label: '规则确认文本',
        description: '在儿童确认规则时显示的文本',
        defaultValue: '我同意遵守这个规则',
        placeholder: '输入规则确认文本...'
      },
      pointsEarnedText: {
        label: '获得积分文本',
        description: '在儿童获得积分时显示的文本',
        defaultValue: '恭喜你获得了{points}积分！',
        placeholder: '输入获得积分文本，使用{points}作为积分占位符...'
      },
      redemptionRequestText: {
        label: '兑换申请文本',
        description: '在儿童申请兑换时显示的文本',
        defaultValue: '我申请兑换{item}，需要{points}积分',
        placeholder: '输入兑换申请文本，使用{item}和{points}作为占位符...'
      },
      badgeEarnedText: {
        label: '获得勋章文本',
        description: '在儿童获得勋章时显示的文本',
        defaultValue: '恭喜你获得了{badge}勋章！',
        placeholder: '输入获得勋章文本，使用{badge}作为勋章名称占位符...'
      }
    };

    res.json(templates);
  } catch (error) {
    console.error('获取自定义文本模板错误:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '服务器内部错误' });
  }
});

// 更新特定自定义文本
router.put('/custom-texts/:key', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      res.status(400).json({ error: 'BAD_REQUEST', message: '缺少文本值' });
      return;
    }

    // 获取当前家庭信息
    const family = await prisma.family.findUnique({
      where: { id: req.user!.familyId }
    });

    if (!family) {
      res.status(404).json({ error: 'NOT_FOUND', message: '家庭不存在' });
      return;
    }

    // 解析现有的自定义文本
    let customTexts: Record<string, string> = {};
    try {
      customTexts = family.customTexts ? JSON.parse(family.customTexts) : {};
    } catch (error) {
      console.error('解析自定义文本失败:', error);
    }

    // 更新特定键的值
    customTexts[key] = value;

    // 更新数据库
    const updatedFamily = await prisma.family.update({
      where: { id: req.user!.familyId },
      data: { customTexts: JSON.stringify(customTexts) }
    });

    // 发送自定义文本更新通知
    NotificationService.sendCustomTextUpdated(req.user!.familyId, {
      userId: req.user!.id,
      username: req.user!.username,
      key: key,
      value: value
    });

    res.json({
      ...updatedFamily,
      customTexts: customTexts,
      message: '自定义文本更新成功'
    });
  } catch (error) {
    console.error('更新自定义文本错误:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '服务器内部错误' });
  }
});

export default router;

// 获取家庭积分排行榜
router.get('/leaderboard', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { period = 'all' } = req.query; // all, week, month
    
    // 获取家庭所有儿童
    const children = await prisma.user.findMany({
      where: {
        familyId: req.user!.familyId,
        role: 'CHILD'
      },
      select: {
        id: true,
        username: true,
        avatar: true,
        theme: true,
        createdAt: true
      }
    });

    // 计算时间范围
    let startDate: Date | undefined;
    if (period === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // 获取每个儿童的积分信息
    const leaderboard = await Promise.all(
      children.map(async (child) => {
        // 获取积分记录
        const pointsRecords = await prisma.pointsRecord.findMany({
          where: {
            userId: child.id,
            ...(startDate && { createdAt: { gte: startDate } })
          }
        });

        // 计算总积分
        const totalPoints = pointsRecords.reduce((sum, record) => sum + record.amount, 0);
        
        // 计算获得的积分（正数）
        const earnedPoints = pointsRecords
          .filter(r => r.amount > 0)
          .reduce((sum, record) => sum + record.amount, 0);
        
        // 计算消费的积分（负数）
        const spentPoints = Math.abs(
          pointsRecords
            .filter(r => r.amount < 0)
            .reduce((sum, record) => sum + record.amount, 0)
        );

        // 获取勋章数量
        const badgeCount = await prisma.userBadge.count({
          where: { userId: child.id }
        });

        // 获取完成的规则数量
        const completedRules = await prisma.pointsRecord.count({
          where: {
            userId: child.id,
            type: 'EARN',
            ...(startDate && { createdAt: { gte: startDate } })
          }
        });

        // 获取兑换次数
        const redemptionCount = await prisma.redemptionRecord.count({
          where: {
            userId: child.id,
            status: { in: ['APPROVED', 'COMPLETED'] },
            ...(startDate && { createdAt: { gte: startDate } })
          }
        });

        return {
          userId: child.id,
          username: child.username,
          avatar: child.avatar,
          theme: child.theme,
          totalPoints,
          earnedPoints,
          spentPoints,
          badgeCount,
          completedRules,
          redemptionCount,
          joinedAt: child.createdAt
        };
      })
    );

    // 按总积分排序
    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

    // 添加排名
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    res.json({
      period,
      leaderboard: rankedLeaderboard,
      totalChildren: children.length
    });
  } catch (error) {
    console.error('获取排行榜错误:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '服务器内部错误' });
  }
});
