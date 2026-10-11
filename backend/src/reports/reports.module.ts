import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClinicAccessGuard } from '../tenancy/clinic-access.guard';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuthModule],
  controllers: [ReportsController],
  providers: [ReportsService, ClinicAccessGuard],
})
export class ReportsModule {}
