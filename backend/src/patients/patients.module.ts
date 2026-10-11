import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClinicAccessGuard } from '../tenancy/clinic-access.guard';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';

@Module({
  imports: [AuthModule],
  controllers: [PatientsController],
  providers: [PatientsService, ClinicAccessGuard],
})
export class PatientsModule {}
