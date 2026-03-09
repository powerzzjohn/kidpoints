import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from '../utils/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 用户连接映射
interface UserConnection {
  userId: string;
  familyId: string;
  role: string;
  socketId: string;
}

class SocketServer {
  private io: SocketIOServer;
  private userConnections: Map<string, UserConnection> = new Map(); // socketId -> UserConnection
  private familyConnections: Map<string, Set<string>> = new Map(); // familyId -> Set<socketId>

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  // 设置中间件
  private setupMiddleware(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('未提供认证令牌'));
        }

        const decoded = verifyToken(token);
        if (!decoded) {
          return next(new Error('无效的认证令牌'));
        }

        // 将用户信息附加到socket对象
        socket.data.user = decoded;
        next();
      } catch (error) {
        console.error('Socket认证错误:', error);
        next(new Error('认证失败'));
      }
    });
  }

  // 设置事件处理器
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const user = socket.data.user;
      console.log(`用户连接: ${user.username} (${user.id})`);

      // 注册用户连接
      this.registerUserConnection(socket.id, user);

      // 加入家庭房间
      socket.join(`family:${user.familyId}`);

      // 发送连接成功消息
      socket.emit('connected', {
        message: '连接成功',
        userId: user.id,
        familyId: user.familyId,
        timestamp: new Date().toISOString()
      });

      // 通知家庭其他成员有新用户上线
      socket.to(`family:${user.familyId}`).emit('user:online', {
        userId: user.id,
        username: user.username,
        role: user.role,
        timestamp: new Date().toISOString()
      });

      // 处理断开连接
      socket.on('disconnect', () => {
        console.log(`用户断开连接: ${user.username} (${user.id})`);
        this.removeUserConnection(socket.id);
        
        // 通知家庭其他成员用户离线
        socket.to(`family:${user.familyId}`).emit('user:offline', {
          userId: user.id,
          username: user.username,
          timestamp: new Date().toISOString()
        });
      });

      // 处理心跳
      socket.on('heartbeat', () => {
        socket.emit('heartbeat:response', {
          timestamp: new Date().toISOString()
        });
      });

      // 处理消息
      socket.on('message:send', async (data) => {
        try {
          const { content, type = 'text', targetUserId } = data;
          
          if (!content) {
            socket.emit('error', { message: '消息内容不能为空' });
            return;
          }

          // 保存消息到数据库
          const message = await prisma.message.create({
            data: {
              senderId: user.id,
              receiverId: targetUserId || null,
              familyId: user.familyId,
              content,
              type,
              isRead: false
            }
          });

          // 发送消息
          if (targetUserId) {
            // 私聊消息
            const targetSocketId = this.getSocketIdByUserId(targetUserId);
            if (targetSocketId) {
              this.io.to(targetSocketId).emit('message:receive', {
                ...message,
                sender: { id: user.id, username: user.username, role: user.role }
              });
            }
          } else {
            // 家庭群聊消息
            this.io.to(`family:${user.familyId}`).emit('message:receive', {
              ...message,
              sender: { id: user.id, username: user.username, role: user.role }
            });
          }

          socket.emit('message:sent', { messageId: message.id });
        } catch (error) {
          console.error('发送消息错误:', error);
          socket.emit('error', { message: '发送消息失败' });
        }
      });

      // 处理消息已读
      socket.on('message:read', async (data) => {
        try {
          const { messageId } = data;
          
          await prisma.message.update({
            where: { id: messageId },
            data: { isRead: true, readAt: new Date() }
          });

          socket.emit('message:read:confirmed', { messageId });
        } catch (error) {
          console.error('标记消息已读错误:', error);
        }
      });

      // 处理加入特定房间
      socket.on('room:join', (room) => {
        socket.join(room);
        socket.emit('room:joined', { room });
      });

      // 处理离开房间
      socket.on('room:leave', (room) => {
        socket.leave(room);
        socket.emit('room:left', { room });
      });
    });
  }

  // 注册用户连接
  private registerUserConnection(socketId: string, user: any): void {
    const connection: UserConnection = {
      userId: user.id,
      familyId: user.familyId,
      role: user.role,
      socketId
    };

    this.userConnections.set(socketId, connection);

    // 添加到家庭连接集合
    if (!this.familyConnections.has(user.familyId)) {
      this.familyConnections.set(user.familyId, new Set());
    }
    this.familyConnections.get(user.familyId)!.add(socketId);

    console.log(`用户连接注册: ${user.username} (家庭: ${user.familyId})`);
  }

  // 移除用户连接
  private removeUserConnection(socketId: string): void {
    const connection = this.userConnections.get(socketId);
    if (connection) {
      // 从家庭连接集合中移除
      const familyConnections = this.familyConnections.get(connection.familyId);
      if (familyConnections) {
        familyConnections.delete(socketId);
        if (familyConnections.size === 0) {
          this.familyConnections.delete(connection.familyId);
        }
      }

      this.userConnections.delete(socketId);
      console.log(`用户连接移除: ${connection.userId} (家庭: ${connection.familyId})`);
    }
  }

  // 根据用户ID获取socketId
  private getSocketIdByUserId(userId: string): string | null {
    for (const [socketId, connection] of this.userConnections) {
      if (connection.userId === userId) {
        return socketId;
      }
    }
    return null;
  }

  // 公共方法：发送积分变化通知
  public sendPointsChange(familyId: string, data: any): void {
    this.io.to(`family:${familyId}`).emit('points:changed', {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // 公共方法：发送兑换申请通知
  public sendRedemptionNotification(familyId: string, data: any): void {
    this.io.to(`family:${familyId}`).emit('redemption:requested', {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // 公共方法：发送兑换处理通知
  public sendRedemptionProcessed(familyId: string, data: any): void {
    this.io.to(`family:${familyId}`).emit('redemption:processed', {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // 公共方法：发送规则确认通知
  public sendRuleConfirmation(familyId: string, data: any): void {
    this.io.to(`family:${familyId}`).emit('rule:confirmed', {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // 公共方法：发送勋章获得通知
  public sendBadgeEarned(familyId: string, data: any): void {
    this.io.to(`family:${familyId}`).emit('badge:earned', {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // 公共方法：发送家庭照片更新通知
  public sendFamilyPhotoUpdated(familyId: string, data: any): void {
    this.io.to(`family:${familyId}`).emit('family:photo:updated', {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // 公共方法：发送自定义文本更新通知
  public sendCustomTextUpdated(familyId: string, data: any): void {
    this.io.to(`family:${familyId}`).emit('custom:text:updated', {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // 公共方法：获取在线用户
  public getOnlineUsers(familyId: string): UserConnection[] {
    const socketIds = this.familyConnections.get(familyId);
    if (!socketIds) return [];

    const users: UserConnection[] = [];
    for (const socketId of socketIds) {
      const connection = this.userConnections.get(socketId);
      if (connection) {
        users.push(connection);
      }
    }
    return users;
  }

  // 公共方法：获取服务器实例
  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default SocketServer;