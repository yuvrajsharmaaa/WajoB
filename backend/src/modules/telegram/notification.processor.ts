import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelegramService } from './telegram.service';
import { Notification } from '@/entities/notifications/notification.entity';

/**
 * Notification Queue Processor
 * 
 * Handles asynchronous notification delivery via Telegram
 */
@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private telegramService: TelegramService,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  @Process('send-telegram-message')
  async handleSendMessage(job: Job) {
    const { telegramId, title, message, data } = job.data;

    try {
      this.logger.log(`Processing notification for user: ${telegramId}`);

      // Format message
      const formattedMessage = `
🔔 ${title}

${message}

${data?.link ? `🔗 ${data.link}` : ''}
      `.trim();

      // Send via Telegram
      await this.telegramService.sendMessage(telegramId, formattedMessage);

      // Update notification status
      if (data?.notificationId) {
        await this.notificationRepository.update(data.notificationId, {
          isSent: true,
          sentAt: new Date(),
        });
      }

      this.logger.log(`Notification sent successfully to ${telegramId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send notification to ${telegramId}: ${error.message}`,
      );
      throw error; // Bull will retry
    }
  }
}
