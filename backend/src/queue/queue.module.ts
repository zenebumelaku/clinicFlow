import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClinicAccessGuard } from '../tenancy/clinic-access.guard';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';

@Module({
  imports: [AuthModule],
  controllers: [QueueController],
  providers: [QueueService, ClinicAccessGuard],
})
export class QueueModule {}
