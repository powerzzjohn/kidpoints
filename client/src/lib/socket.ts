import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

// Socket.io连接配置
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// Socket连接状态
export interface SocketConnection {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (content: string, type?: string, targetUserId?: string) => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}

// 通知类型
export interface PointsChangeNotification {
  userId: string;
  username: string;
  amount: number;
  reason: string;
  balance: number;
  type: 'earn' | 'spend' | 'bonus';
  timestamp: string;
  event: string;
}

export interface RedemptionNotification {
  userId: string;
  username: string;
  itemName: string;
  points: number;
  redemptionId: string;
  status: 'requested' | 'approved' | 'rejected' | 'completed';
  timestamp: string;
  event: string;
}

export interface RuleConfirmationNotification {
  userId: string;
  username: string;
  ruleName: string;
  ruleId: string;
  points: number;
  timestamp: string;
  event: string;
}

export interface BadgeEarnedNotification {
  userId: string;
  username: string;
  badgeName: string;
  badgeIcon: string;
  badgeId: string;
  timestamp: string;
  event: string;
}

export interface FamilyPhotoNotification {
  userId: string;
  username: string;
  photoUrl: string;
  timestamp: string;
  event: string;
}

export interface CustomTextNotification {
  userId: string;
  username: string;
  key: string;
  value: string;
  timestamp: string;
  event: string;
}

export interface SystemNotification {
  message: string;
  data?: any;
  timestamp: string;
  event: string;
}

export interface PrivateNotification {
  userId: string;
  message: string;
  data?: any;
  timestamp: string;
  event: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string | null;
  familyId: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  sender: {
    id: string;
    username: string;
    role: string;
  };
}

// 创建Socket连接
class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // 连接状态监听器
  private connectionListeners: Array<(connected: boolean) => void> = [];
  // 通知监听器
  private notificationListeners: {
    pointsChanged: Array<(data: PointsChangeNotification) => void>;
    redemptionRequested: Array<(data: RedemptionNotification) => void>;
    redemptionProcessed: Array<(data: RedemptionNotification) => void>;
    ruleConfirmed: Array<(data: RuleConfirmationNotification) => void>;
    badgeEarned: Array<(data: BadgeEarnedNotification) => void>;
    familyPhotoUpdated: Array<(data: FamilyPhotoNotification) => void>;
    customTextUpdated: Array<(data: CustomTextNotification) => void>;
    systemNotification: Array<(data: SystemNotification) => void>;
    privateNotification: Array<(data: PrivateNotification) => void>;
    messageReceived: Array<(data: Message) => void>;
    userOnline: Array<(data: { userId: string; username: string; role: string; timestamp: string }) => void>;
    userOffline: Array<(data: { userId: string; username: string; timestamp: string }) => void>;
  } = {
    pointsChanged: [],
    redemptionRequested: [],
    redemptionProcessed: [],
    ruleConfirmed: [],
    badgeEarned: [],
    familyPhotoUpdated: [],
    customTextUpdated: [],
    systemNotification: [],
    privateNotification: [],
    messageReceived: [],
    userOnline: [],
    userOffline: []
  };

  constructor() {
    this.setupEventListeners();
  }

  // 设置事件监听器
  private setupEventListeners(): void {
    // 监听认证状态变化
    useAuthStore.subscribe((state) => {
      if (state.isAuthenticated && !this.isConnected) {
        this.connect();
      } else if (!state.isAuthenticated && this.isConnected) {
        this.disconnect();
      }
    });
  }

  // 连接Socket
  public connect(): void {
    const token = useAuthStore.getState().token;
    const user = useAuthStore.getState().user;

    if (!token || !user) {
      console.warn('无法连接Socket: 用户未认证');
      return;
    }

    if (this.socket && this.isConnected) {
      console.log('Socket已连接');
      return;
    }

    console.log('正在连接Socket.io服务器...');

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    this.setupSocketListeners();
  }

  // 设置Socket监听器
  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket.io连接成功');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionChange(true);
    });

    this.socket.on('connected', (data) => {
      console.log('连接成功消息:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.io断开连接:', reason);
      this.isConnected = false;
      this.notifyConnectionChange(false);
      
      if (reason === 'io server disconnect') {
        // 服务器主动断开，需要重新连接
        setTimeout(() => this.connect(), 1000);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.io连接错误:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('达到最大重连次数，停止重连');
        this.disconnect();
      }
    });

    // 通知事件监听
    this.socket.on('points:changed', (data: PointsChangeNotification) => {
      console.log('收到积分变化通知:', data);
      this.notificationListeners.pointsChanged.forEach(listener => listener(data));
    });

    this.socket.on('redemption:requested', (data: RedemptionNotification) => {
      console.log('收到兑换申请通知:', data);
      this.notificationListeners.redemptionRequested.forEach(listener => listener(data));
    });

    this.socket.on('redemption:processed', (data: RedemptionNotification) => {
      console.log('收到兑换处理通知:', data);
      this.notificationListeners.redemptionProcessed.forEach(listener => listener(data));
    });

    this.socket.on('rule:confirmed', (data: RuleConfirmationNotification) => {
      console.log('收到规则确认通知:', data);
      this.notificationListeners.ruleConfirmed.forEach(listener => listener(data));
    });

    this.socket.on('badge:earned', (data: BadgeEarnedNotification) => {
      console.log('收到勋章获得通知:', data);
      this.notificationListeners.badgeEarned.forEach(listener => listener(data));
    });

    this.socket.on('family:photo:updated', (data: FamilyPhotoNotification) => {
      console.log('收到家庭照片更新通知:', data);
      this.notificationListeners.familyPhotoUpdated.forEach(listener => listener(data));
    });

    this.socket.on('custom:text:updated', (data: CustomTextNotification) => {
      console.log('收到自定义文本更新通知:', data);
      this.notificationListeners.customTextUpdated.forEach(listener => listener(data));
    });

    this.socket.on('system:notification', (data: SystemNotification) => {
      console.log('收到系统通知:', data);
      this.notificationListeners.systemNotification.forEach(listener => listener(data));
    });

    this.socket.on('private:notification', (data: PrivateNotification) => {
      console.log('收到私聊通知:', data);
      this.notificationListeners.privateNotification.forEach(listener => listener(data));
    });

    this.socket.on('message:receive', (data: Message) => {
      console.log('收到消息:', data);
      this.notificationListeners.messageReceived.forEach(listener => listener(data));
    });

    this.socket.on('user:online', (data) => {
      console.log('用户上线:', data);
      this.notificationListeners.userOnline.forEach(listener => listener(data));
    });

    this.socket.on('user:offline', (data) => {
      console.log('用户离线:', data);
      this.notificationListeners.userOffline.forEach(listener => listener(data));
    });

    this.socket.on('error', (error) => {
      console.error('Socket错误:', error);
    });
  }

  // 断开连接
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.notifyConnectionChange(false);
      console.log('Socket已断开连接');
    }
  }

  // 发送消息
  public sendMessage(content: string, type: string = 'text', targetUserId?: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('无法发送消息: Socket未连接');
      return;
    }

    this.socket.emit('message:send', { content, type, targetUserId });
  }

  // 加入房间
  public joinRoom(room: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('无法加入房间: Socket未连接');
      return;
    }

    this.socket.emit('room:join', room);
  }

  // 离开房间
  public leaveRoom(room: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('无法离开房间: Socket未连接');
      return;
    }

    this.socket.emit('room:leave', room);
  }

  // 标记消息已读
  public markMessageAsRead(messageId: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('无法标记消息已读: Socket未连接');
      return;
    }

    this.socket.emit('message:read', { messageId });
  }

  // 发送心跳
  public sendHeartbeat(): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('heartbeat');
  }

  // 添加连接状态监听器
  public addConnectionListener(listener: (connected: boolean) => void): void {
    this.connectionListeners.push(listener);
  }

  // 移除连接状态监听器
  public removeConnectionListener(listener: (connected: boolean) => void): void {
    this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
  }

  // 添加通知监听器
  public addNotificationListener<T extends keyof typeof this.notificationListeners>(
    type: T,
    listener: (typeof this.notificationListeners)[T][0]
  ): void {
    this.notificationListeners[type].push(listener as any);
  }

  // 移除通知监听器
  public removeNotificationListener<T extends keyof typeof this.notificationListeners>(
    type: T,
    listener: (typeof this.notificationListeners)[T][0]
  ): void {
    this.notificationListeners[type] = this.notificationListeners[type].filter(l => l !== listener) as any;
  }

  // 通知连接状态变化
  private notifyConnectionChange(connected: boolean): void {
    this.connectionListeners.forEach(listener => listener(connected));
  }

  // 获取连接状态
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // 获取Socket实例
  public getSocket(): Socket | null {
    return this.socket;
  }
}

// 创建单例实例
const socketService = new SocketService();

export default socketService;