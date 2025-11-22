import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all jobs' })
  findAll() {
    return this.jobsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new job' })
  create(@Body() jobData: any) {
    return this.jobsService.create(jobData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update job' })
  update(@Param('id') id: string, @Body() jobData: any) {
    return this.jobsService.update(id, jobData);
  }
}
