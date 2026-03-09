import React, { useState, useEffect } from 'react';
import socketService, {
  PointsChangeNotification,
  RedemptionNotification,
  RuleConfirmationNotification,
  BadgeEarnedNotification,
  FamilyPhotoNotification,
  CustomTextNotification,
  SystemNotification,
  PrivateNotification,
  Message
} from '../lib/socket';

// 通知类型
type NotificationType = 
  | 'points:changed'
  | 'redemption:requested'
  | 'redemption:processed'
  | 'rule:confirmed'
  | 'badge:earned'
  | 'family:photo:updated'
  | 'custom:text:updated'
  | 'system:notification'
  | 'private:notification'
  | 'message:receive'
  | 'user:online'
  | 'user:offline';

// 通知项
interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  data: any;
  read: boolean;
}

interface NotificationDisplayProps {
  maxNotifications?: number;
  autoCloseDelay?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export default function NotificationDisplay({
  maxNotifications = 5,
  autoCloseDelay = 5000,
  position = 'top-right'
}: NotificationDisplayProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // 位置样式
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  // 添加通知
  const addNotification = (type: NotificationType, title: string, message: string, data: any) => {
    const newNotification: NotificationItem = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      data,
      read: false
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      if (updated.length > maxNotifications) {
        return updated.slice(0, maxNotifications);
      }
      return updated;
    });

    // 自动关闭
    if (autoCloseDelay > 0) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, autoCloseDelay);
    }
  };

  // 移除通知
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // 标记为已读
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // 清除所有通知
  const clearAll = () => {
    setNotifications([]);
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  // 获取通知图标
  const getNotificationIcon = (type: NotificationType) => {
    const icons: Record<NotificationType, string> = {
      'points:changed': '💰',
      'redemption:requested': '🎁',
      'redemption:processed': '✅',
      'rule:confirmed': '📝',
      'badge:earned': '🏆',
      'family:photo:updated': '📸',
      'custom:text:updated': '✏️',
      'system:notification': '🔔',
      'private:notification': '💬',
      'message:receive': '💬',
      'user:online': '🟢',
      'user:offline': '🔴'
    };
    return icons[type] || '🔔';
  };

  // 获取通知颜色
  const getNotificationColor = (type: NotificationType) => {
    const colors: Record<NotificationType, string> = {
      'points:changed': 'bg-yellow-50 border-yellow-200',
      'redemption:requested': 'bg-blue-50 border-blue-200',
      'redemption:processed': 'bg-green-50 border-green-200',
      'rule:confirmed': 'bg-purple-50 border-purple-200',
      'badge:earned': 'bg-orange-50 border-orange-200',
      'family:photo:updated': 'bg-pink-50 border-pink-200',
      'custom:text:updated': 'bg-indigo-50 border-indigo-200',
      'system:notification': 'bg-gray-50 border-gray-200',
      'private:notification': 'bg-teal-50 border-teal-200',
      'message:receive': 'bg-teal-50 border-teal-200',
      'user:online': 'bg-emerald-50 border-emerald-200',
      'user:offline': 'bg-rose-50 border-rose-200'
    };
    return colors[type] || 'bg-gray-50 border-gray-200';
  };

  // 设置Socket监听器
  useEffect(() => {
    // 连接状态监听
    socketService.addConnectionListener(setIsConnected);

    // 积分变化通知
    socketService.addNotificationListener('pointsChanged', (data: PointsChangeNotification) => {
      const action = data.amount > 0 ? '获得' : '消费';
      addNotification(
        'points:changed',
        '积分变化',
        `${data.username} ${action} ${Math.abs(data.amount)} 积分 (${data.reason})`,
        data
      );
    });

    // 兑换申请通知
    socketService.addNotificationListener('redemptionRequested', (data: RedemptionNotification) => {
      addNotification(
        'redemption:requested',
        '兑换申请',
        `${data.username} 申请兑换 ${data.itemName} (${data.points}积分)`,
        data
      );
    });

    // 兑换处理通知
    socketService.addNotificationListener('redemptionProcessed', (data: RedemptionNotification) => {
      const statusText = {
        'requested': '申请',
        'approved': '批准',
        'rejected': '拒绝',
        'completed': '完成'
      }[data.status] || data.status;

      addNotification(
        'redemption:processed',
        '兑换处理',
        `${data.username} 的兑换申请已${statusText}`,
        data
      );
    });

    // 规则确认通知
    socketService.addNotificationListener('ruleConfirmed', (data: RuleConfirmationNotification) => {
      addNotification(
        'rule:confirmed',
        '规则确认',
        `${data.username} 确认了规则 "${data.ruleName}"`,
        data
      );
    });

    // 勋章获得通知
    socketService.addNotificationListener('badgeEarned', (data: BadgeEarnedNotification) => {
      addNotification(
        'badge:earned',
        '获得勋章',
        `${data.username} 获得了 ${data.badgeName} 勋章！`,
        data
      );
    });

    // 家庭照片更新通知
    socketService.addNotificationListener('familyPhotoUpdated', (data: FamilyPhotoNotification) => {
      addNotification(
        'family:photo:updated',
        '家庭照片更新',
        `${data.username} 更新了家庭照片`,
        data
      );
    });

    // 自定义文本更新通知
    socketService.addNotificationListener('customTextUpdated', (data: CustomTextNotification) => {
      addNotification(
        'custom:text:updated',
        '自定义文本更新',
        `${data.username} 更新了 ${data.key}`,
        data
      );
    });

    // 系统通知
    socketService.addNotificationListener('systemNotification', (data: SystemNotification) => {
      addNotification(
        'system:notification',
        '系统通知',
        data.message,
        data
      );
    });

    // 私聊通知
    socketService.addNotificationListener('privateNotification', (data: PrivateNotification) => {
      addNotification(
        'private:notification',
        '私聊消息',
        data.message,
        data
      );
    });

    // 消息接收
    socketService.addNotificationListener('messageReceived', (data: Message) => {
      addNotification(
        'message:receive',
        '新消息',
        `${data.sender.username}: ${data.content}`,
        data
      );
    });

    // 用户上线
    socketService.addNotificationListener('userOnline', (data) => {
      addNotification(
        'user:online',
        '用户上线',
        `${data.username} 已上线`,
        data
      );
    });

    // 用户离线
    socketService.addNotificationListener('userOffline', (data) => {
      addNotification(
        'user:offline',
        '用户离线',
        `${data.username} 已离线`,
        data
      );
    });

    // 清理监听器
    return () => {
      socketService.removeConnectionListener(setIsConnected);
      socketService.removeNotificationListener('pointsChanged', () => {});
      socketService.removeNotificationListener('redemptionRequested', () => {});
      socketService.removeNotificationListener('redemptionProcessed', () => {});
      socketService.removeNotificationListener('ruleConfirmed', () => {});
      socketService.removeNotificationListener('badgeEarned', () => {});
      socketService.removeNotificationListener('familyPhotoUpdated', () => {});
      socketService.removeNotificationListener('customTextUpdated', () => {});
      socketService.removeNotificationListener('systemNotification', () => {});
      socketService.removeNotificationListener('privateNotification', () => {});
      socketService.removeNotificationListener('messageReceived', () => {});
      socketService.removeNotificationListener('userOnline', () => {});
      socketService.removeNotificationListener('userOffline', () => {});
    };
  }, []);

  // 如果没有通知，不显示
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`fixed ${positionStyles[position]} z-50 flex flex-col space-y-2 max-w-sm`}>
      {/* 连接状态指示器 */}
      <div className={`px-3 py-1 rounded-full text-xs font-medium ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {isConnected ? '🟢 实时连接' : '🔴 连接断开'}
      </div>

      {/* 通知列表 */}
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`relative p-4 rounded-lg shadow-lg border ${getNotificationColor(notification.type)} transition-all duration-300 transform hover:scale-[1.02] ${
            notification.read ? 'opacity-75' : ''
          }`}
          onClick={() => markAsRead(notification.id)}
        >
          {/* 关闭按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeNotification(notification.id);
            }}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>

          {/* 通知内容 */}
          <div className="flex items-start space-x-3">
            <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                <span className="text-xs text-gray-500">{formatTime(notification.timestamp)}</span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
              
              {/* 操作按钮（根据通知类型） */}
              {notification.type === 'message:receive' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // 这里可以添加回复消息的逻辑
                    console.log('回复消息:', notification.data);
                  }}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  回复
                </button>
              )}
            </div>
          </div>

          {/* 未读指示器 */}
          {!notification.read && (
            <div className="absolute top-2 left-2 w-2 h-2 bg-red-500 rounded-full"></div>
          )}
        </div>
      ))}

      {/* 清除所有按钮 */}
      {notifications.length > 1 && (
        <button
          onClick={clearAll}
          className="self-end text-xs text-gray-500 hover:text-gray-700"
        >
          清除所有
        </button>
      )}
    </div>
  );
}