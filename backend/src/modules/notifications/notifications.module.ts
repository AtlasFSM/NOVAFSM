import { Module } from '@nestjs/common';
import { PushNotificationService } from './push-notification.service';
import { SmsNotificationService } from './sms-notification.service';

@Module({
  providers: [PushNotificationService, SmsNotificationService],
  exports: [PushNotificationService, SmsNotificationService],
})
export class NotificationsModule {}
