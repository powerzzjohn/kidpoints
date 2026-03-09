import { getSocketServer } from '../index';

// 通知类型定义
export interface PointsChangeNotification {
  userId: string;
  username: string;
  amount: number;
  reason: string;
  balance: number;
  type: 'earn' | 'spend' | 'bonus';
}

export interface RedemptionNotification {
  userId: string;
  username: string;
  itemName: string;
  points: number;
  redemptionId: string;
  status: 'requested' | 'approved' | 'rejected' | 'completed';
}

export interface RuleConfirmationNotification {
  userId: string;
  username: string;
  ruleName: string;
  ruleId: string;
  points: number;
}

export interface BadgeEarnedNotification {
  userId: string;
  username: string;
  badgeName: string;
  badgeIcon: string;
  badgeId: string;
}

export interface FamilyPhotoNotification {
  userId: string;
  username: string;
  photoUrl: string;
}

export interface CustomTextNotification {
  userId: string;
  username: string;
  key: string;
  value: string;
}

// 通知工具类
class NotificationService {
  // 发送积分变化通知
  static sendPointsChange(familyId: string, data: PointsChangeNotification): void {
    try {
      const socketServer = getSocketServer();
      socketServer.sendPointsChange(familyId, {
        ...data,
        event: 'points:changed'
      });
      console.log(`积分变化通知已发送到家庭 ${familyId}: ${data.username} ${data.amount > 0 ? '获得' : '消费'} ${Math.abs(data.amount)} 积分`);
    } catch (error) {
      console.error('发送积分变化通知失败:', error);
    }
  }

  // 发送兑换申请通知
  static sendRedemptionRequested(familyId: string, data: RedemptionNotification): void {
    try {
      const socketServer = getSocketServer();
      socketServer.sendRedemptionNotification(familyId, {
        ...data,
        event: 'redemption:requested'
      });
      console.log(`兑换申请通知已发送到家庭 ${familyId}: ${data.username} 申请兑换 ${data.itemName}`);
    } catch (error) {
      console.error('发送兑换申请通知失败:', error);
    }
  }

  // 发送兑换处理通知
  static sendRedemptionProcessed(familyId: string, data: RedemptionNotification): void {
    try {
      const socketServer = getSocketServer();
      socketServer.sendRedemptionProcessed(familyId, {
        ...data,
        event: 'redemption:processed'
      });
      console.log(`兑换处理通知已发送到家庭 ${familyId}: ${data.username} 的兑换申请已${this.getStatusText(data.status)}`);
    } catch (error) {
      console.error('发送兑换处理通知失败:', error);
    }
  }

  // 发送规则确认通知
  static sendRuleConfirmation(familyId: string, data: RuleConfirmationNotification): void {
    try {
      const socketServer = getSocketServer();
      socketServer.sendRuleConfirmation(familyId, {
        ...data,
        event: 'rule:confirmed'
      });
      console.log(`规则确认通知已发送到家庭 ${familyId}: ${data.username} 确认了规则 ${data.ruleName}`);
    } catch (error) {
      console.error('发送规则确认通知失败:', error);
    }
  }

  // 发送勋章获得通知
  static sendBadgeEarned(familyId: string, data: BadgeEarnedNotification): void {
    try {
      const socketServer = getSocketServer();
      socketServer.sendBadgeEarned(familyId, {
        ...data,
        event: 'badge:earned'
      });
      console.log(`勋章获得通知已发送到家庭 ${familyId}: ${data.username} 获得了 ${data.badgeName} 勋章`);
    } catch (error) {
      console.error('发送勋章获得通知失败:', error);
    }
  }

  // 发送家庭照片更新通知
  static sendFamilyPhotoUpdated(familyId: string, data: FamilyPhotoNotification): void {
    try {
      const socketServer = getSocketServer();
      socketServer.sendFamilyPhotoUpdated(familyId, {
        ...data,
        event: 'family:photo:updated'
      });
      console.log(`家庭照片更新通知已发送到家庭 ${familyId}: ${data.username} 更新了家庭照片`);
    } catch (error) {
      console.error('发送家庭照片更新通知失败:', error);
    }
  }

  // 发送自定义文本更新通知
  static sendCustomTextUpdated(familyId: string, data: CustomTextNotification): void {
    try {
      const socketServer = getSocketServer();
      socketServer.sendCustomTextUpdated(familyId, {
        ...data,
        event: 'custom:text:updated'
      });
      console.log(`自定义文本更新通知已发送到家庭 ${familyId}: ${data.username} 更新了 ${data.key}`);
    } catch (error) {
      console.error('发送自定义文本更新通知失败:', error);
    }
  }

  // 发送系统通知
  static sendSystemNotification(familyId: string, message: string, data?: any): void {
    try {
      const socketServer = getSocketServer();
      socketServer.getIO().to(`family:${familyId}`).emit('system:notification', {
        message,
        data,
        timestamp: new Date().toISOString(),
        event: 'system:notification'
      });
      console.log(`系统通知已发送到家庭 ${familyId}: ${message}`);
    } catch (error) {
      console.error('发送系统通知失败:', error);
    }
  }

  // 发送私聊通知
  static sendPrivateNotification(userId: string, message: string, data?: any): void {
    try {
      const socketServer = getSocketServer();
      // 这里需要实现根据用户ID找到对应的socket连接
      // 暂时先发送到所有连接，由客户端过滤
      socketServer.getIO().emit('private:notification', {
        userId,
        message,
        data,
        timestamp: new Date().toISOString(),
        event: 'private:notification'
      });
      console.log(`私聊通知已发送到用户 ${userId}: ${message}`);
    } catch (error) {
      console.error('发送私聊通知失败:', error);
    }
  }

  // 获取在线用户
  static getOnlineUsers(familyId: string): any[] {
    try {
      const socketServer = getSocketServer();
      return socketServer.getOnlineUsers(familyId);
    } catch (error) {
      console.error('获取在线用户失败:', error);
      return [];
    }
  }

  // 辅助方法：获取状态文本
  private static getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'requested': '申请',
      'approved': '批准',
      'rejected': '拒绝',
      'completed': '完成'
    };
    return statusMap[status] || status;
  }
}

export default NotificationService;