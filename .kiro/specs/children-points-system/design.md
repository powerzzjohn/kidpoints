# 设计文档

## 概述

儿童积分系统是一个基于Web的全栈应用，采用现代化的前后端分离架构。系统通过游戏化设计和双角色权限管理，为家庭提供一个有趣且实用的积分管理平台。

## 架构

### 整体架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端应用       │    │   后端API       │    │   数据库        │
│   (React/Vue)   │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ - 家长界面      │    │ - 用户认证      │    │ - 用户数据      │
│ - 儿童界面      │    │ - 积分管理      │    │ - 积分记录      │
│ - 主题系统      │    │ - 商城管理      │    │ - 商品数据      │
│ - 实时通知      │    │ - 实时通信      │    │ - 勋章系统      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 技术栈选择
- **前端**: React + TypeScript + Tailwind CSS + Framer Motion
- **后端**: Node.js + Express + TypeScript + Socket.io
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: JWT + bcrypt
- **实时通信**: Socket.io
- **文件存储**: 本地存储 + Multer
- **状态管理**: Zustand
- **UI组件**: 自定义游戏化组件库

## 组件和接口

### 前端组件架构

#### 1. 路由结构
```
/
├── /login              # 角色选择和登录
├── /parent             # 家长界面
│   ├── /dashboard      # 家长仪表板
│   ├── /rules          # 行为规则管理
│   ├── /shop           # 商城管理
│   ├── /points         # 积分操作
│   └── /settings       # 系统设置
└── /child              # 儿童界面
    ├── /dashboard      # 儿童仪表板
    ├── /points         # 积分查看
    ├── /shop           # 商城浏览
    ├── /badges         # 勋章展示
    └── /profile        # 个人资料
```

#### 2. 核心组件

**通用组件**
- `GameButton`: 游戏化按钮组件，支持主题切换
- `PointsDisplay`: 积分显示组件，带动画效果
- `ThemeProvider`: 主题管理组件
- `NotificationSystem`: 实时通知组件

**家长专用组件**
- `RuleEditor`: 行为规则编辑器
- `ShopManager`: 商城管理界面
- `PointsController`: 积分操作控制器
- `ChildProgress`: 儿童进度监控

**儿童专用组件**
- `GameDashboard`: 游戏化仪表板
- `BadgeCollection`: 勋章收集展示
- `ShopBrowser`: 商城浏览器
- `PointsHistory`: 积分历史查看器

### 后端API设计

#### 1. 认证相关
```typescript
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/profile
PUT  /api/auth/profile
```

#### 2. 用户管理
```typescript
GET  /api/users/family          # 获取家庭成员
POST /api/users/child           # 添加儿童账户
PUT  /api/users/child/:id       # 更新儿童信息
```

#### 3. 积分系统
```typescript
GET  /api/points/balance/:userId    # 获取积分余额
GET  /api/points/history/:userId    # 获取积分历史
POST /api/points/add               # 添加积分
POST /api/points/deduct            # 扣除积分
```

#### 4. 行为规则
```typescript
GET  /api/rules                 # 获取所有规则
POST /api/rules                 # 创建新规则
PUT  /api/rules/:id             # 更新规则
DELETE /api/rules/:id           # 删除规则
POST /api/rules/:id/confirm     # 儿童确认规则
```

#### 5. 商城管理
```typescript
GET  /api/shop/items            # 获取商品列表
POST /api/shop/items            # 添加商品
PUT  /api/shop/items/:id        # 更新商品
DELETE /api/shop/items/:id      # 删除商品
POST /api/shop/redeem           # 申请兑换
PUT  /api/shop/redeem/:id       # 处理兑换申请
```

#### 6. 勋章系统
```typescript
GET  /api/badges/:userId        # 获取用户勋章
POST /api/badges/award          # 颁发勋章
GET  /api/badges/templates      # 获取勋章模板
POST /api/badges/templates      # 创建自定义勋章
```

## 数据模型

### 1. 用户模型
```typescript
interface User {
  id: string
  username: string
  password: string
  role: 'parent' | 'child'
  familyId: string
  avatar?: string
  theme: 'pvz' | 'minecraft'
  createdAt: Date
  updatedAt: Date
}
```

### 2. 积分记录模型
```typescript
interface PointsRecord {
  id: string
  userId: string
  amount: number
  type: 'earn' | 'spend' | 'bonus'
  reason: string
  ruleId?: string
  createdBy: string
  createdAt: Date
}
```

### 3. 行为规则模型
```typescript
interface BehaviorRule {
  id: string
  familyId: string
  name: string
  description: string
  points: number
  category: 'study' | 'chores' | 'exercise' | 'behavior'
  isActive: boolean
  effectiveDate: Date
  confirmedBy: string[]
  createdAt: Date
  updatedAt: Date
}
```

### 4. 商品模型
```typescript
interface ShopItem {
  id: string
  familyId: string
  name: string
  description: string
  points: number
  type: 'physical' | 'virtual'
  category: string
  image?: string
  isActive: boolean
  stock?: number
  createdAt: Date
  updatedAt: Date
}
```

### 5. 兑换记录模型
```typescript
interface RedemptionRecord {
  id: string
  userId: string
  itemId: string
  points: number
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  requestedAt: Date
  processedAt?: Date
  processedBy?: string
  notes?: string
}
```

### 6. 勋章模型
```typescript
interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: 'independence' | 'study' | 'exercise' | 'custom'
  condition: {
    ruleId: string
    count: number
    period: 'week' | 'month'
  }
  familyId?: string
}

interface UserBadge {
  id: string
  userId: string
  badgeId: string
  earnedAt: Date
  progress: number
}
```

## 错误处理

### 1. 前端错误处理
- **网络错误**: 显示友好的重试提示
- **权限错误**: 自动跳转到登录页面
- **表单验证**: 实时验证和错误提示
- **主题加载失败**: 回退到默认主题

### 2. 后端错误处理
```typescript
interface ApiError {
  code: string
  message: string
  details?: any
}

// 错误码定义
enum ErrorCodes {
  UNAUTHORIZED = 'UNAUTHORIZED',
  INSUFFICIENT_POINTS = 'INSUFFICIENT_POINTS',
  RULE_NOT_EFFECTIVE = 'RULE_NOT_EFFECTIVE',
  ITEM_OUT_OF_STOCK = 'ITEM_OUT_OF_STOCK'
}
```

### 3. 数据库错误处理
- **连接失败**: 自动重连机制
- **事务回滚**: 确保数据一致性
- **约束违反**: 返回具体的错误信息

## 测试策略

### 1. 单元测试
- **组件测试**: React Testing Library
- **API测试**: Jest + Supertest
- **工具函数测试**: Jest

### 2. 集成测试
- **端到端测试**: Playwright
- **API集成测试**: 测试完整的用户流程
- **数据库集成测试**: 测试数据持久化

### 3. 用户体验测试
- **响应式设计测试**: 多设备兼容性
- **主题切换测试**: 确保主题正确加载
- **动画性能测试**: 确保流畅的用户体验

### 4. 安全测试
- **权限测试**: 确保角色权限正确
- **输入验证测试**: 防止恶意输入
- **会话管理测试**: JWT安全性验证

## 性能优化

### 1. 前端优化
- **代码分割**: 按路由和组件懒加载
- **图片优化**: WebP格式和响应式图片
- **缓存策略**: Service Worker缓存静态资源
- **动画优化**: 使用CSS Transform和GPU加速

### 2. 后端优化
- **数据库索引**: 为常用查询添加索引
- **缓存机制**: Redis缓存热点数据
- **API限流**: 防止恶意请求
- **数据分页**: 大数据集分页加载

### 3. 实时通信优化
- **Socket连接池**: 管理WebSocket连接
- **消息队列**: 处理高并发通知
- **心跳检测**: 确保连接稳定性

## 安全考虑

### 1. 认证和授权
- **JWT令牌**: 安全的用户认证
- **角色权限**: 严格的权限控制
- **会话管理**: 自动过期和刷新机制

### 2. 数据保护
- **密码加密**: bcrypt哈希加密
- **输入验证**: 防止SQL注入和XSS
- **文件上传**: 限制文件类型和大小

### 3. 隐私保护
- **数据最小化**: 只收集必要的用户数据
- **家庭隔离**: 确保家庭数据隔离
- **儿童保护**: 特殊的儿童数据保护措施