import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user with Telegram ID and wallet' })
  async login(@Body() loginDto: { telegramId: number; walletAddress: string }) {
    const user = await this.authService.validateUser(
      loginDto.telegramId,
      loginDto.walletAddress,
    );
    
    if (!user) {
      return { error: 'Invalid credentials' };
    }
    
    return this.authService.login(user);
  }
}
