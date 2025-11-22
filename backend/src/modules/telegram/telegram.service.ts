import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as TelegramBot from 'node-telegram-bot-api';
import { User } from '@/entities/users/user.entity';
import { Notification, NotificationType } from '@/entities/notifications/notification.entity';

/**
 * Telegram Bot Service
 * 
 * Handles:
 * - Bot initialization and webhook setup
 * - Incoming message parsing
 * - Push notifications to users
 * - User session validation
 */
@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot: TelegramBot;
  private readonly botToken: string;
  private readonly webhookUrl: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectQueue('notifications')
    private notificationQueue: Queue,
  ) {
    this.botToken = this.configService.get('TELEGRAM_BOT_TOKEN');
    this.webhookUrl = this.configService.get('TELEGRAM_WEBHOOK_URL');
  }

  async onModuleInit() {
    await this.initializeBot();
  }

  /**
   * Initialize Telegram Bot
   */
  private async initializeBot() {
    try {
      if (!this.botToken) {
        this.logger.warn('Telegram bot token not configured');
        return;
      }

      // Initialize bot
      if (this.webhookUrl) {
        // Production: Use webhooks
        this.bot = new TelegramBot(this.botToken);
        await this.bot.setWebHook(this.webhookUrl);
        this.logger.log(`Telegram bot webhook set to: ${this.webhookUrl}`);
      } else {
        // Development: Use polling
        this.bot = new TelegramBot(this.botToken, { polling: true });
        this.logger.log('Telegram bot started with polling');
      }

      this.setupMessageHandlers();
      this.logger.log('Telegram bot initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize Telegram bot: ${error.message}`);
    }
  }

  /**
   * Setup message handlers
   */
  private setupMessageHandlers() {
    // Start command
    this.bot.onText(/\/start/, async (msg) => {
      await this.handleStart(msg);
    });

    // Help command
    this.bot.onText(/\/help/, async (msg) => {
      await this.handleHelp(msg);
    });

    // Profile command
    this.bot.onText(/\/profile/, async (msg) => {
      await this.handleProfile(msg);
    });

    // Jobs command
    this.bot.onText(/\/jobs/, async (msg) => {
      await this.handleJobs(msg);
    });

    // Handle text messages
    this.bot.on('message', async (msg) => {
      if (!msg.text || msg.text.startsWith('/')) return;
      await this.handleMessage(msg);
    });
  }

  /**
   * Handle /start command
   */
  private async handleStart(msg: TelegramBot.Message) {
    const telegramId = msg.from.id;
    const username = msg.from.username;
    const firstName = msg.from.first_name;
    const lastName = msg.from.last_name;

    try {
      // Find or create user
      let user = await this.userRepository.findOne({
        where: { telegramId },
      });

      if (!user) {
        user = this.userRepository.create({
          telegramId,
          telegramUsername: username,
          firstName,
          lastName,
        });
        await this.userRepository.save(user);
        this.logger.log(`New user registered: ${telegramId}`);
      } else {
        // Update user info
        user.telegramUsername = username;
        user.firstName = firstName;
        user.lastName = lastName;
        user.lastActiveAt = new Date();
        await this.userRepository.save(user);
      }

      const welcomeMessage = `
Welcome to WajoB! 🚀

Your daily-wage job marketplace on TON blockchain.

${user.walletAddress ? '✅ Wallet connected' : '⚠️ Please connect your TON wallet'}

Commands:
/profile - View your profile
/jobs - Browse available jobs
/help - Get help

👇 Click the button below to open the app!
      `;

      await this.bot.sendMessage(msg.chat.id, welcomeMessage, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Open WajoB',
                web_app: {
                  url: this.configService.get('CORS_ORIGIN').split(',')[0],
                },
              },
            ],
          ],
        },
      });
    } catch (error) {
      this.logger.error(`Error in /start handler: ${error.message}`);
      await this.bot.sendMessage(
        msg.chat.id,
        'Sorry, something went wrong. Please try again.',
      );
    }
  }

  /**
   * Handle /help command
   */
  private async handleHelp(msg: TelegramBot.Message) {
    const helpMessage = `
📚 WajoB Help

How it works:
1. Connect your TON wallet
2. Browse or post jobs
3. Use escrow for secure payments
4. Build your reputation

Commands:
/start - Start the bot
/profile - View your profile
/jobs - Browse jobs
/help - Show this message

Need more help? Visit our docs or contact support.
    `;

    await this.bot.sendMessage(msg.chat.id, helpMessage);
  }

  /**
   * Handle /profile command
   */
  private async handleProfile(msg: TelegramBot.Message) {
    try {
      const user = await this.userRepository.findOne({
        where: { telegramId: msg.from.id },
      });

      if (!user) {
        await this.bot.sendMessage(
          msg.chat.id,
          'Please use /start first to register.',
        );
        return;
      }

      const profileMessage = `
👤 Your Profile

Name: ${user.firstName} ${user.lastName || ''}
Username: @${user.telegramUsername || 'N/A'}
Wallet: ${user.walletAddress ? `${user.walletAddress.slice(0, 8)}...` : 'Not connected'}
Role: ${user.role}

📊 Stats:
⭐ Reputation: ${user.reputationScore}/5.0 (${user.totalRatings} ratings)
✅ Jobs Completed: ${user.jobsCompleted}
📝 Jobs Posted: ${user.jobsPosted}

Joined: ${user.createdAt.toLocaleDateString()}
      `;

      await this.bot.sendMessage(msg.chat.id, profileMessage);
    } catch (error) {
      this.logger.error(`Error in /profile handler: ${error.message}`);
    }
  }

  /**
   * Handle /jobs command
   */
  private async handleJobs(msg: TelegramBot.Message) {
    const jobsMessage = `
📋 Available Jobs

Use the Web App to browse and apply for jobs!

Click the button below to open WajoB 👇
    `;

    await this.bot.sendMessage(msg.chat.id, jobsMessage, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🔍 Browse Jobs',
              web_app: {
                url: `${this.configService.get('CORS_ORIGIN').split(',')[0]}/jobs`,
              },
            },
          ],
        ],
      },
    });
  }

  /**
   * Handle general messages
   */
  private async handleMessage(msg: TelegramBot.Message) {
    await this.bot.sendMessage(
      msg.chat.id,
      'Please use the commands or open the Web App to interact with WajoB. Type /help for more info.',
    );
  }

  /**
   * Process webhook updates
   */
  async processUpdate(update: any) {
    try {
      this.bot.processUpdate(update);
    } catch (error) {
      this.logger.error(`Error processing webhook update: ${error.message}`);
    }
  }

  /**
   * Send notification to user
   */
  async sendNotification(
    telegramId: number,
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
  ) {
    try {
      // Save notification to database
      const user = await this.userRepository.findOne({
        where: { telegramId },
      });

      if (!user) {
        this.logger.warn(`User not found for telegramId: ${telegramId}`);
        return;
      }

      if (!user.notificationsEnabled) {
        this.logger.debug(`Notifications disabled for user: ${telegramId}`);
        return;
      }

      const notification = this.notificationRepository.create({
        userId: user.id,
        type,
        title,
        message,
        data,
      });
      await this.notificationRepository.save(notification);

      // Add to queue for async processing
      await this.notificationQueue.add('send-telegram-message', {
        telegramId,
        title,
        message,
        data,
      });

      this.logger.log(`Notification queued for user: ${telegramId}`);
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
    }
  }

  /**
   * Send direct message (used by notification processor)
   */
  async sendMessage(
    telegramId: number,
    text: string,
    options?: TelegramBot.SendMessageOptions,
  ) {
    try {
      await this.bot.sendMessage(telegramId, text, options);
      this.logger.debug(`Message sent to ${telegramId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send message to ${telegramId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Validate Telegram user with wallet address
   */
  async validateUserSession(telegramId: number, walletAddress: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({
        where: { telegramId },
      });

      if (!user) return false;
      if (!user.walletAddress) return false;
      
      return user.walletAddress.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      this.logger.error(`Session validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Link wallet to Telegram user
   */
  async linkWallet(telegramId: number, walletAddress: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({
        where: { telegramId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      user.walletAddress = walletAddress;
      user.lastActiveAt = new Date();
      await this.userRepository.save(user);

      await this.sendMessage(
        telegramId,
        `✅ Wallet connected successfully!\n\nAddress: ${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`,
      );

      return true;
    } catch (error) {
      this.logger.error(`Failed to link wallet: ${error.message}`);
      return false;
    }
  }
}
