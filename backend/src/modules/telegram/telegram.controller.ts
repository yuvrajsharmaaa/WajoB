import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';

@ApiTags('telegram')
@Controller('telegram')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private telegramService: TelegramService) {}

  /**
   * Webhook endpoint for Telegram updates
   * POST /api/v1/telegram/webhook
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Telegram webhook for bot updates' })
  async handleWebhook(@Body() update: any) {
    this.logger.debug(`Received webhook update: ${JSON.stringify(update)}`);
    
    try {
      await this.telegramService.processUpdate(update);
      return { success: true };
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
