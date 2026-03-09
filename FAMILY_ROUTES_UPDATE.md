# 家庭路由系统更新文档

## 新增功能

### 1. 家庭照片上传功能

#### 上传家庭照片
- **端点**: `POST /api/family/upload-photo`
- **认证**: 需要有效的JWT令牌
- **权限**: 所有家庭成员
- **请求格式**: `multipart/form-data`
- **参数**: 
  - `photo`: 图片文件（支持JPEG, JPG, PNG, GIF, WebP格式，最大5MB）
- **响应**: 更新后的家庭信息，包含新的照片URL

#### 删除家庭照片
- **端点**: `DELETE /api/family/photo`
- **认证**: 需要有效的JWT令牌
- **权限**: 所有家庭成员
- **响应**: 更新后的家庭信息，照片字段设为null

### 2. 自定义文本管理系统

#### 获取自定义文本模板
- **端点**: `GET /api/family/custom-texts/templates`
- **认证**: 需要有效的JWT令牌
- **权限**: 所有家庭成员
- **响应**: 包含所有可自定义文本字段的模板信息

**可用模板字段**:
- `welcomeMessage`: 欢迎消息（仪表板顶部显示）
- `encouragementText`: 鼓励文本（儿童完成任务时显示）
- `shopWelcome`: 商城欢迎语
- `ruleConfirmationText`: 规则确认文本
- `pointsEarnedText`: 获得积分文本（支持{points}占位符）
- `redemptionRequestText`: 兑换申请文本（支持{item}和{points}占位符）
- `badgeEarnedText`: 获得勋章文本（支持{badge}占位符）

#### 更新特定自定义文本
- **端点**: `PUT /api/family/custom-texts/:key`
- **认证**: 需要有效的JWT令牌
- **权限**: 所有家庭成员
- **请求体**: `{ "value": "新的文本内容" }`
- **响应**: 更新后的家庭信息

### 3. 增强的家庭信息管理

#### 获取家庭信息
- **端点**: `GET /api/family/info`
- **增强**: 现在自动解析并返回`customTexts`字段的JSON内容

#### 更新家庭信息
- **端点**: `PUT /api/family/info`
- **增强**: 支持`customTexts`字段的JSON字符串自动处理

## 技术实现

### 文件上传系统
1. **存储位置**: `server/uploads/family-photos/`
2. **文件命名**: `family-photo-{timestamp}-{random}.{ext}`
3. **文件限制**: 
   - 最大文件大小: 5MB
   - 允许格式: JPEG, JPG, PNG, GIF, WebP
   - 每次只能上传一个文件
4. **URL格式**: `/uploads/family-photos/{filename}`

### 数据模型更新
家庭模型现在支持：
- `photo`: 家庭照片URL
- `customTexts`: JSON字符串，存储所有自定义文本

### 错误处理
所有端点都包含完整的错误处理：
- 400: 请求参数错误
- 401: 未授权
- 403: 权限不足
- 404: 资源不存在
- 500: 服务器内部错误

## 使用示例

### 上传家庭照片
```bash
curl -X POST http://localhost:3001/api/family/upload-photo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photo=@family-photo.jpg"
```

### 更新欢迎消息
```bash
curl -X PUT http://localhost:3001/api/family/custom-texts/welcomeMessage \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "欢迎来到我们的家庭！"}'
```

### 获取家庭信息
```bash
curl -X GET http://localhost:3001/api/family/info \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 测试脚本
已创建测试脚本 `test-family-routes.js`，可用于验证所有新功能。

## 下一步工作
1. 前端个性化设置界面开发
2. 实时预览功能实现
3. 主题系统与自定义文本的集成
4. 多语言支持扩展

## 注意事项
1. 上传目录需要确保有写入权限
2. 生产环境需要考虑文件存储的安全性
3. 建议定期清理未使用的上传文件
4. 自定义文本支持HTML转义，防止XSS攻击