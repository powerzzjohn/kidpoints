# 主题系统快速集成模板

## 步骤1: 添加导入
在文件顶部添加：
```typescript
import { useTheme } from '../../contexts/ThemeContext';
```

## 步骤2: 在组件中使用
在组件函数中添加：
```typescript
const { themeConfig } = useTheme();
```

## 步骤3: 更新背景
找到 `min-h-screen bg-gradient-to-br` 开头的div，替换为：
```typescript
<div className={`min-h-screen bg-gradient-to-br ${themeConfig.colors.background}`}>
```

## 步骤4: 更新加载状态背景
找到加载状态的div，如果有背景色，也更新为：
```typescript
<div className={`min-h-screen bg-gradient-to-br ${themeConfig.colors.background} flex items-center justify-center`}>
```

## 需要更新的页面

### 儿童端页面
1. `RulesConfirmation.tsx` - 规则确认
2. `Shop.tsx` - 商城
3. `Redemptions.tsx` - 兑换记录

### 家长端页面  
1. `BadgeManagement.tsx` - 勋章管理
2. `PointsManagement.tsx` - 积分管理
3. `RulesManagement.tsx` - 规则管理
4. `ShopManagement.tsx` - 商城管理
5. `RedemptionApproval.tsx` - 兑换审批

## 已完成的页面
✅ `ChildDashboard.tsx` - 儿童仪表板
✅ `ParentDashboard.tsx` - 家长仪表板
✅ `LoginPage.tsx` - 登录页面
✅ `BadgeCollection.tsx` - 勋章收藏
✅ `PointsHistory.tsx` - 积分历史

## 快速检查命令
```bash
# 检查编译状态
npm run build

# 检查TypeScript错误
npx tsc --noEmit
```

## 测试步骤
1. 启动开发服务器
2. 登录儿童账号
3. 切换主题，检查页面背景是否更新
4. 登录家长账号
5. 切换主题，检查页面背景是否更新