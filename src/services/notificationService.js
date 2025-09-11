const prisma = require('../prismaClient');

class NotificationService {
  // Create a notification for a specific user
  static async createNotification(userId, type, title, message, metadata = null) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          metadata,
          status: 'UNREAD'
        }
      });
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create notifications for all admins and managers
  static async notifyAdminsAndManagers(type, title, message, metadata = null) {
    try {
      // Get all admins and managers
      const adminsAndManagers = await prisma.user.findMany({
        where: {
          role: {
            in: ['ADMIN', 'MANAGER']
          }
        },
        select: {
          id: true,
          name: true,
          role: true
        }
      });

      // Create notifications for each admin and manager
      const notifications = await Promise.all(
        adminsAndManagers.map(user => 
          this.createNotification(user.id, type, title, message, metadata)
        )
      );

      console.log(`Created ${notifications.length} notifications for admins and managers`);
      return notifications;
    } catch (error) {
      console.error('Error notifying admins and managers:', error);
      throw error;
    }
  }

  // Notify about new trainee signup
  static async notifyNewTraineeSignup(trainee) {
    const title = 'New Trainee Signup';
    const message = `${trainee.name} (${trainee.email}) has signed up and is pending approval.`;
    const metadata = {
      traineeId: trainee.id,
      traineeName: trainee.name,
      traineeEmail: trainee.email,
      signupDate: trainee.createdAt
    };

    return await this.notifyAdminsAndManagers(
      'NEW_TRAINEE_SIGNUP',
      title,
      message,
      metadata
    );
  }

  // Notify trainee about approval/rejection
  static async notifyTraineeStatusChange(trainee, status, companyName = null) {
    let title, message;
    
    if (status === 'APPROVED') {
      title = 'Account Approved';
      message = `Your account has been approved${companyName ? ` and assigned to ${companyName}` : ''}. You can now log in and start your training.`;
    } else if (status === 'REJECTED') {
      title = 'Account Rejected';
      message = 'Your account has been rejected. Please contact an administrator for more information.';
    }

    const metadata = {
      status,
      companyName,
      approvalDate: new Date().toISOString()
    };

    return await this.createNotification(
      trainee.id,
      'TRAINEE_APPROVED',
      title,
      message,
      metadata
    );
  }

  // Get notifications for a user
  static async getUserNotifications(userId, limit = 50, offset = 0) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      return notifications;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: userId
        },
        data: {
          status: 'READ'
        }
      });

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          status: 'UNREAD'
        },
        data: {
          status: 'READ'
        }
      });

      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get unread notification count for a user
  static async getUnreadCount(userId) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          status: 'UNREAD'
        }
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Delete old notifications (cleanup)
  static async deleteOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          status: 'READ'
        }
      });

      console.log(`Deleted ${result.count} old notifications`);
      return result;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
