import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { User } from '@/entities/users/user.entity';
import { Notification } from '@/entities/notifications/notification.entity';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { NotificationProcessor } from './notification.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Notification]),
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [TelegramController],
  providers: [TelegramService, NotificationProcessor],
  exports: [TelegramService],
})
export class TelegramModule {}
