# 勋章系统实现说明

## 功能概述

勋章系统是儿童积分系统的成就激励模块，通过设定行为目标和自动追踪进度，鼓励儿童养成良好习惯。

## 系统特性

### 1. 勋章类型

#### 系统预设勋章
- 🌟 **学习之星**: 连续一周完成作业获得
- 🏠 **独立能手**: 连续一周整理房间获得
- ⚽ **运动之星**: 连续一周坚持运动获得

#### 自定义勋章
- 家长可以创建任意数量的自定义勋章
- 可选择不同的图标（🏆⭐🎖️👑💎🔥⚡🌟🎯🏅）
- 可关联任意行为规则
- 可设置完成次数和时间周期（每周/每月）

### 2. 进度追踪

系统自动追踪每个勋章的完成进度：
- 实时计算当前完成次数
- 显示目标次数
- 计算完成百分比
- 可视化进度条

### 3. 自动颁发

当儿童完成指定次数的行为规则后：
- 系统自动检测条件是否满足
- 自动颁发勋章
- 记录获得时间
- 在勋章墙显示"已获得"标记

## API 接口

### 获取勋章模板
```
GET /api/badges/templates
Authorization: Bearer {token}
```

返回所有勋章模板（系统预设 + 家庭自定义）

### 获取用户勋章
```
GET /api/badges/user/:userId
Authorization: Bearer {token}
```

返回用户的所有勋章及进度信息：
- `earned`: 是否已获得
- `progress`: 完成百分比
- `currentCount`: 当前完成次数
- `targetCount`: 目标次数

### 创建自定义勋章
```
POST /api/badges/templates
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "阅读达人",
  "description": "连续一周每天阅读30分钟",
  "icon": "📚",
  "category": "CUSTOM",
  "ruleId": "规则ID",
  "count": 7,
  "period": "week"
}
```

### 删除自定义勋章
```
DELETE /api/badges/templates/:id
Authorization: Bearer {token}
```

只能删除家庭自定义勋章，系统预设勋章不可删除。

### 手动颁发勋章
```
POST /api/badges/award
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "用户ID",
  "badgeId": "勋章ID"
}
```

### 检查并自动颁发
```
POST /api/badges/check-and-award/:userId
Authorization: Bearer {token}
```

检查用户是否满足任何勋章条件，自动颁发符合条件的勋章。

## 前端页面

### 儿童端 - 勋章收藏 (`/child/badges`)

**功能特性：**
- 显示勋章收集进度（已获得/总数）
- 进度条可视化
- 筛选器：全部/已获得/未获得
- 勋章卡片展示：
  - 已获得：彩色图标 + 获得时间
  - 未获得：灰色图标 + 进度条
- 游戏化设计：渐变背景、动画效果

**UI 元素：**
- 统计卡片：显示收集进度和完成度
- 筛选按钮：快速切换视图
- 勋章网格：卡片式布局，悬停放大效果
- 进度指示：百分比 + 进度条

### 家长端 - 勋章管理 (`/parent/badges`)

**功能特性：**
- 查看所有勋章（系统 + 自定义）
- 创建自定义勋章
- 删除自定义勋章
- 查看勋章条件

**创建勋章表单：**
- 勋章名称（必填）
- 勋章描述（必填）
- 图标选择（10种可选）
- 关联规则（下拉选择）
- 完成次数（数字输入）
- 时间周期（每周/每月）

## 数据库设计

### Badge 表
```prisma
model Badge {
  id          String   @id @default(cuid())
  name        String
  description String
  icon        String
  category    String   // STUDY, INDEPENDENCE, EXERCISE, CUSTOM
  condition   String   // JSON格式: {"ruleId":"xxx","count":3,"period":"week"}
  familyId    String?  // null表示系统预设
  createdAt   DateTime @default(now())
}
```

### UserBadge 表
```prisma
model UserBadge {
  id        String   @id @default(cuid())
  userId    String
  badgeId   String
  earnedAt  DateTime @default(now())
}
```

## 使用流程

### 家长创建自定义勋章
1. 登录家长账号
2. 进入"勋章管理"页面
3. 点击"创建自定义勋章"
4. 填写勋章信息：
   - 名称：如"阅读达人"
   - 描述：如"连续一周每天阅读30分钟"
   - 选择图标：📚
   - 关联规则：选择"完成阅读"规则
   - 完成次数：7次
   - 时间周期：每周
5. 提交创建

### 儿童查看勋章进度
1. 登录儿童账号
2. 点击仪表板的"我的勋章"
3. 查看所有勋章和进度
4. 使用筛选器查看已获得/未获得的勋章
5. 查看每个勋章的完成进度

### 自动获得勋章
1. 儿童完成相关行为（如完成作业）
2. 家长在积分管理中添加积分
3. 系统自动检查勋章条件
4. 如果满足条件（如一周内完成3次），自动颁发勋章
5. 儿童在勋章墙看到新获得的勋章

## 技术实现

### 进度计算逻辑
```typescript
// 获取指定时间周期内的行为完成次数
const startDate = period === 'week' 
  ? subWeeks(now, 1) 
  : subMonths(now, 1);

const count = await prisma.pointsRecord.count({
  where: {
    userId,
    ruleId,
    createdAt: { gte: startDate }
  }
});

// 计算进度百分比
const progress = Math.min(100, Math.round((count / targetCount) * 100));
```

### 自动颁发逻辑
```typescript
// 检查是否满足条件
if (currentCount >= targetCount && !earned) {
  // 颁发勋章
  await prisma.userBadge.create({
    data: { userId, badgeId }
  });
}
```

## 测试数据

当前系统中小明（xiaoming）的勋章进度：
- 学习之星：67% (2/3)
- 独立能手：33% (1/3)
- 运动之星：0% (0/3)

## 扩展建议

1. **勋章等级**: 添加铜牌、银牌、金牌等级
2. **勋章奖励**: 获得勋章时额外奖励积分
3. **勋章展示**: 在仪表板显示最新获得的勋章
4. **勋章分享**: 生成勋章卡片图片分享
5. **勋章统计**: 显示家庭成员勋章排行榜
