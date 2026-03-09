import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始种子数据初始化...');

  // 创建示例家庭
  const family = await prisma.family.create({
    data: {
      name: '示例家庭',
      description: '这是一个示例家庭，用于演示系统功能',
      customTexts: JSON.stringify({
        welcomeMessage: '欢迎来到我们的积分世界！',
        encouragementText: '你真棒！继续加油！',
        shopWelcome: '用你的积分兑换心仪的礼物吧！'
      })
    }
  });

  // 创建家长账户
  const hashedParentPassword = await bcrypt.hash('parent123', 10);
  const parent = await prisma.user.create({
    data: {
      username: 'parent',
      password: hashedParentPassword,
      role: 'PARENT',
      familyId: family.id,
      theme: 'PVZ'
    }
  });

  // 创建儿童账户
  const hashedChildPassword = await bcrypt.hash('child123', 10);
  const child = await prisma.user.create({
    data: {
      username: 'xiaoming',
      password: hashedChildPassword,
      role: 'CHILD',
      familyId: family.id,
      theme: 'PVZ'
    }
  });

  // 创建行为规则
  const studyRule = await prisma.behaviorRule.create({
    data: {
      name: '完成作业',
      description: '按时完成当天的所有作业',
      points: 10,
      category: 'STUDY',
      isActive: true,
      effectiveDate: new Date(),
      familyId: family.id,
      createdById: parent.id
    }
  });

  const choresRule = await prisma.behaviorRule.create({
    data: {
      name: '整理房间',
      description: '保持房间整洁，物品摆放有序',
      points: 5,
      category: 'CHORES',
      isActive: true,
      effectiveDate: new Date(),
      familyId: family.id,
      createdById: parent.id
    }
  });

  const exerciseRule = await prisma.behaviorRule.create({
    data: {
      name: '户外运动',
      description: '进行30分钟以上的户外运动',
      points: 8,
      category: 'EXERCISE',
      isActive: true,
      effectiveDate: new Date(),
      familyId: family.id,
      createdById: parent.id
    }
  });

  // 儿童确认规则
  await prisma.ruleConfirmation.createMany({
    data: [
      { ruleId: studyRule.id, userId: child.id },
      { ruleId: choresRule.id, userId: child.id },
      { ruleId: exerciseRule.id, userId: child.id }
    ]
  });

  // 创建预设勋章
  const studyBadge = await prisma.badge.create({
    data: {
      name: '学习之星',
      description: '连续一周完成作业获得',
      icon: '🌟',
      category: 'STUDY',
      condition: JSON.stringify({
        ruleId: studyRule.id,
        count: 3,
        period: 'week'
      })
    }
  });

  const choresBadge = await prisma.badge.create({
    data: {
      name: '独立能手',
      description: '连续一周整理房间获得',
      icon: '🏠',
      category: 'INDEPENDENCE',
      condition: JSON.stringify({
        ruleId: choresRule.id,
        count: 3,
        period: 'week'
      })
    }
  });

  const exerciseBadge = await prisma.badge.create({
    data: {
      name: '运动之星',
      description: '连续一周坚持运动获得',
      icon: '⚽',
      category: 'EXERCISE',
      condition: JSON.stringify({
        ruleId: exerciseRule.id,
        count: 3,
        period: 'week'
      })
    }
  });

  // 创建商城商品
  await prisma.shopItem.createMany({
    data: [
      {
        name: '乐高积木套装',
        description: '创意城市系列，培养动手能力',
        points: 100,
        type: 'PHYSICAL',
        category: '玩具',
        familyId: family.id,
        stock: 1
      },
      {
        name: '游戏时间延长30分钟',
        description: '当天可以多玩30分钟游戏',
        points: 20,
        type: 'VIRTUAL',
        category: '特权',
        familyId: family.id
      },
      {
        name: '和爸爸一起踢球',
        description: '爸爸陪你踢球30分钟',
        points: 15,
        type: 'VIRTUAL',
        category: '亲子活动',
        familyId: family.id
      },
      {
        name: '自选10美元以下玩具',
        description: '可以自己选择一个10美元以下的玩具',
        points: 50,
        type: 'VIRTUAL',
        category: '自选礼品',
        familyId: family.id
      },
      {
        name: '儿童绘本',
        description: '精美插图儿童故事书',
        points: 30,
        type: 'PHYSICAL',
        category: '书籍',
        familyId: family.id,
        stock: 3
      }
    ]
  });

  // 给儿童一些初始积分
  await prisma.pointsRecord.create({
    data: {
      userId: child.id,
      amount: 50,
      type: 'BONUS',
      reason: '欢迎奖励 - 初始积分',
      createdById: parent.id
    }
  });

  // 添加一些积分记录
  await prisma.pointsRecord.createMany({
    data: [
      {
        userId: child.id,
        amount: 10,
        type: 'EARN',
        reason: '完成作业',
        ruleId: studyRule.id,
        createdById: parent.id,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 昨天
      },
      {
        userId: child.id,
        amount: 5,
        type: 'EARN',
        reason: '整理房间',
        ruleId: choresRule.id,
        createdById: parent.id,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12小时前
      }
    ]
  });

  // 建立父母-子女关系
  await prisma.parentChildRelation.create({
    data: {
      parentId: parent.id,
      childId: child.id,
      relation: 'parent',
      isPrimary: true
    }
  });

  console.log('种子数据初始化完成！');
  console.log(`家庭ID: ${family.id}`);
  console.log(`家长账户: parent / parent123`);
  console.log(`儿童账户: xiaoming / child123`);
  console.log(`已建立父母-子女关系`);
}

main()
  .catch((e) => {
    console.error('种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });