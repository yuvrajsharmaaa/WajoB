import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EscrowService } from './escrow.service';

@ApiTags('escrow')
@Controller('escrow')
export class EscrowController {
  constructor(private escrowService: EscrowService) {}

  @Get()
  @ApiOperation({ summary: 'Get all escrows' })
  findAll() {
    return this.escrowService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get escrow by ID' })
  findOne(@Param('id') id: string) {
    return this.escrowService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new escrow' })
  create(@Body() escrowData: any) {
    return this.escrowService.create(escrowData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update escrow' })
  update(@Param('id') id: string, @Body() escrowData: any) {
    return this.escrowService.update(id, escrowData);
  }
}
