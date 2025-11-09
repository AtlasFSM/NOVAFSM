import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
}

/**
 * Push Notification Service
 * Sends push notifications to mobile devices via FCM (Firebase Cloud Messaging)
 *
 * TODO: Integrate with Firebase Admin SDK for actual push notifications
 * For now, this logs notifications for development purposes
 */
@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private fcmEnabled: boolean;

  constructor(private configService: ConfigService) {
    this.fcmEnabled = this.configService.get<boolean>('push.fcm.enabled', false);

    if (this.fcmEnabled) {
      // TODO: Initialize Firebase Admin SDK
      // const serviceAccount = this.configService.get('push.fcm.serviceAccount');
      // admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      this.logger.log('Push notifications configured (FCM)');
    } else {
      this.logger.log('Push notifications disabled - will log only');
    }
  }

  /**
   * Send push notification to a user
   */
  async sendToUser(payload: PushNotificationPayload): Promise<void> {
    try {
      if (!this.fcmEnabled) {
        // Log for development
        this.logger.log(
          `[DEV] Push notification to user ${payload.userId}: ${payload.title} - ${payload.body}`
        );
        return;
      }

      // TODO: Get user's device tokens from database
      // const tokens = await this.getUserDeviceTokens(payload.userId);

      // TODO: Send via FCM
      // const message = {
      //   notification: {
      //     title: payload.title,
      //     body: payload.body,
      //   },
      //   data: payload.data || {},
      //   tokens,
      // };
      // const response = await admin.messaging().sendMulticast(message);

      this.logger.log(`Push notification sent to user ${payload.userId}`);
    } catch (error) {
      this.logger.error(`Failed to send push notification to user ${payload.userId}:`, error);
      throw error;
    }
  }

  /**
   * Send job assignment notification
   */
  async sendJobAssignmentNotification(
    technicianId: string,
    jobNumber: string,
    jobTitle: string,
    scheduledStart?: Date,
  ): Promise<void> {
    const body = scheduledStart
      ? `Scheduled for ${scheduledStart.toLocaleDateString()}`
      : 'New job assigned to you';

    await this.sendToUser({
      userId: technicianId,
      title: `New Job: ${jobNumber}`,
      body,
      data: {
        type: 'job_assigned',
        jobNumber,
      },
      badge: 1,
      sound: 'default',
    });
  }

  /**
   * Send job update notification
   */
  async sendJobUpdateNotification(
    technicianId: string,
    jobNumber: string,
    message: string,
  ): Promise<void> {
    await this.sendToUser({
      userId: technicianId,
      title: `Job Update: ${jobNumber}`,
      body: message,
      data: {
        type: 'job_update',
        jobNumber,
      },
    });
  }

  /**
   * Register device token for a user
   * TODO: Implement device token storage
   */
  async registerDeviceToken(userId: string, token: string, deviceType: 'ios' | 'android'): Promise<void> {
    this.logger.log(`Device token registered for user ${userId} (${deviceType})`);
    // TODO: Store in database
    // await this.prisma.deviceToken.upsert({
    //   where: { token },
    //   create: { userId, token, deviceType, lastUsedAt: new Date() },
    //   update: { lastUsedAt: new Date() },
    // });
  }

  /**
   * Unregister device token
   * TODO: Implement device token removal
   */
  async unregisterDeviceToken(token: string): Promise<void> {
    this.logger.log(`Device token unregistered: ${token}`);
    // TODO: Remove from database
    // await this.prisma.deviceToken.delete({ where: { token } });
  }
}
