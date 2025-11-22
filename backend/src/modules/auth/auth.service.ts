import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(telegramId: number, walletAddress: string) {
    const user = await this.usersService.findByTelegramId(telegramId);
    
    if (user && user.walletAddress === walletAddress) {
      return user;
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      sub: user.id, 
      telegramId: user.telegramId,
      walletAddress: user.walletAddress 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
