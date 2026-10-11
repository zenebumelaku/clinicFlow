import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClinicAccessGuard } from '../tenancy/clinic-access.guard';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [AuthModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, ClinicAccessGuard],
})
export class AppointmentsModule {}
