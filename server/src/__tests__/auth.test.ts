import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../index';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();

describe('认证系统测试', () => {
  let testFamily: any;
  let testUser: any;

  beforeAll(async () => {
    // 创建测试家庭
    testFamily = await prisma.family.create({
      data: {
        name: '测试家庭',
        description: '用于测试的家庭'
      }
    });

    // 创建测试用户
    const hashedPassword = await hashPassword('test123');
    testUser = await prisma.user.create({
      data: {
        username: 'testuser',
        password: hashedPassword,
        role: 'PARENT',
        familyId: testFamily.id,
        theme: 'PVZ'
      }
    });
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.user.deleteMany({ where: { familyId: testFamily.id } });
    await prisma.family.delete({ where: { id: testFamily.id } });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/login', () => {
    it('应该成功登录并返回 token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'test123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toMatchObject({
        username: 'testuser',
        role: 'PARENT'
      });
    });

    it('应该拒绝错误的密码', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('UNAUTHORIZED');
    });

    it('应该拒绝不存在的用户', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'test123'
        });

      expect(response.status).toBe(401);
    });

    it('应该验证必填字段', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth/profile', () => {
    let token: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'test123'
        });
      token = response.body.token;
    });

    it('应该返回当前用户信息', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.username).toBe('testuser');
    });

    it('应该拒绝未认证的请求', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/auth/profile', () => {
    let token: string;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'test123'
        });
      token = response.body.token;
    });

    it('应该更新用户主题', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ theme: 'MINECRAFT' });

      expect(response.status).toBe(200);
      expect(response.body.theme).toBe('MINECRAFT');
    });
  });
});
