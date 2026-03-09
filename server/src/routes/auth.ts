import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 登录
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'BAD_REQUEST', message: '用户名和密码不能为空' });
      return;
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: '用户名或密码错误' });
      return;
    }

    // 验证密码
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: '用户名或密码错误' });
      return;
    }

    // 生成 token
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      familyId: user.familyId
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        familyId: user.familyId,
        avatar: user.avatar,
        theme: user.theme
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '服务器内部错误' });
  }
});

// 登出
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: '登出成功' });
});

// 获取当前用户信息
router.get('/profile', authenticate, async (req: AuthRequest, res): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        role: true,
        familyId: true,
        avatar: true,
        theme: true,
        createdAt: true
      }
    });

    if (!user) {
      res.status(404).json({ error: 'NOT_FOUND', message: '用户不存在' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '服务器内部错误' });
  }
});

// 更新用户信息
router.put('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const { avatar, theme } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(avatar !== undefined && { avatar }),
        ...(theme !== undefined && { theme })
      },
      select: {
        id: true,
        username: true,
        role: true,
        familyId: true,
        avatar: true,
        theme: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: '服务器内部错误' });
  }
});

export default router;
