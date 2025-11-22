import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReputationService } from './reputation.service';

@ApiTags('reputation')
@Controller('reputation')
export class ReputationController {
  constructor(private reputationService: ReputationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all reputations' })
  findAll() {
    return this.reputationService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reputation by ID' })
  findOne(@Param('id') id: string) {
    return this.reputationService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user reputation history' })
  findByUserId(@Param('userId') userId: string) {
    return this.reputationService.findByUserId(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Submit reputation rating' })
  create(@Body() reputationData: any) {
    return this.reputationService.create(reputationData);
  }
}
