import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * SMS Notification Service
 * Sends SMS notifications via Twilio
 *
 * Configuration required in .env:
 * TWILIO_ACCOUNT_SID=your_account_sid
 * TWILIO_AUTH_TOKEN=your_auth_token
 * TWILIO_PHONE_NUMBER=your_twilio_phone_number
 * SMS_ENABLED=true
 */
@Injectable()
export class SmsNotificationService {
  private readonly logger = new Logger(SmsNotificationService.name);
  private smsEnabled: boolean;
  private twilioClient: any;
  private twilioPhoneNumber: string;

  constructor(private configService: ConfigService) {
    this.smsEnabled = this.configService.get<boolean>('sms.enabled', false);

    if (this.smsEnabled) {
      try {
        // Dynamically import Twilio (optional dependency)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const twilio = require('twilio');

        const accountSid = this.configService.get<string>('sms.twilio.accountSid');
        const authToken = this.configService.get<string>('sms.twilio.authToken');
        this.twilioPhoneNumber = this.configService.get<string>('sms.twilio.phoneNumber');

        if (!accountSid || !authToken || !this.twilioPhoneNumber) {
          throw new Error('Twilio credentials not configured');
        }

        this.twilioClient = twilio(accountSid, authToken);
        this.logger.log('SMS notifications configured (Twilio)');
      } catch (error) {
        this.logger.warn(`Failed to initialize Twilio: ${error.message}. SMS will be logged only.`);
        this.smsEnabled = false;
      }
    } else {
      this.logger.log('SMS notifications disabled - will log only');
    }
  }

  /**
   * Send SMS message to a phone number
   */
  async sendSms(to: string, message: string): Promise<void> {
    try {
      if (!this.smsEnabled) {
        // Log for development
        this.logger.log(`[DEV] SMS to ${to}: ${message}`);
        return;
      }

      // Send via Twilio
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to: to,
      });

      this.logger.log(`SMS sent to ${to} (SID: ${result.sid})`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send job assignment SMS notification
   */
  async sendJobAssignmentSms(
    technicianPhone: string,
    technicianName: string,
    jobNumber: string,
    jobTitle: string,
    scheduledStart?: Date,
  ): Promise<void> {
    const scheduledText = scheduledStart
      ? ` scheduled for ${scheduledStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : '';

    const message = `Hi ${technicianName}, you've been assigned to job ${jobNumber}: ${jobTitle}${scheduledText}. Check the app for details.`;

    await this.sendSms(technicianPhone, message);
  }

  /**
   * Send job update SMS notification
   */
  async sendJobUpdateSms(
    technicianPhone: string,
    jobNumber: string,
    updateMessage: string,
  ): Promise<void> {
    const message = `Job ${jobNumber} update: ${updateMessage}`;

    await this.sendSms(technicianPhone, message);
  }

  /**
   * Send job completion reminder SMS
   */
  async sendJobCompletionReminderSms(
    technicianPhone: string,
    jobNumber: string,
  ): Promise<void> {
    const message = `Reminder: Please complete job ${jobNumber} and update the status in the app.`;

    await this.sendSms(technicianPhone, message);
  }

  /**
   * Send emergency job assignment SMS
   */
  async sendEmergencyJobSms(
    technicianPhone: string,
    technicianName: string,
    jobNumber: string,
    jobTitle: string,
    customerName: string,
  ): Promise<void> {
    const message = `URGENT: ${technicianName}, emergency job ${jobNumber} assigned. Customer: ${customerName}. Title: ${jobTitle}. Check app immediately.`;

    await this.sendSms(technicianPhone, message);
  }

  /**
   * Send customer notification SMS
   */
  async sendCustomerNotificationSms(
    customerPhone: string,
    message: string,
  ): Promise<void> {
    await this.sendSms(customerPhone, message);
  }

  /**
   * Send job scheduled confirmation SMS to customer
   */
  async sendJobScheduledConfirmationSms(
    customerPhone: string,
    customerName: string,
    jobNumber: string,
    scheduledDate: Date,
    technicianName?: string,
  ): Promise<void> {
    const techText = technicianName ? ` with ${technicianName}` : '';
    const dateText = scheduledDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    const message = `Hi ${customerName}, your service appointment ${jobNumber} is scheduled for ${dateText}${techText}. We'll see you then!`;

    await this.sendSms(customerPhone, message);
  }

  /**
   * Send technician on the way SMS to customer
   */
  async sendTechnicianEnRouteSms(
    customerPhone: string,
    technicianName: string,
    estimatedArrival: string,
  ): Promise<void> {
    const message = `Your technician ${technicianName} is on the way! Estimated arrival: ${estimatedArrival}.`;

    await this.sendSms(customerPhone, message);
  }
}
