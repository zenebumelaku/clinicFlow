import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
  @Public()
  @SkipThrottle()
  @Get('health')
  @ApiOperation({ summary: 'Application health and status check' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy and responding',
    schema: {
      example: {
        status: 'ok',
        service: 'mediflow-et-backend',
        version: '1.0.0',
        timestamp: '2026-10-08T19:30:00.000Z',
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
      service: 'mediflow-et-backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
