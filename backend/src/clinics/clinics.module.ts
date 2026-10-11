import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClinicAccessGuard } from '../tenancy/clinic-access.guard';
import { ClinicsController } from './clinics.controller';
import { ClinicsService } from './clinics.service';
import { BranchesController } from '../branches/branches.controller';
import { BranchesService } from '../branches/branches.service';
import { StaffController } from '../staff/staff.controller';
import { StaffService } from '../staff/staff.service';
import { DoctorsController } from '../doctors/doctors.controller';
import { DoctorsService } from '../doctors/doctors.service';

@Module({
  imports: [AuthModule],
  controllers: [ClinicsController, BranchesController, StaffController, DoctorsController],
  providers: [ClinicsService, BranchesService, StaffService, DoctorsService, ClinicAccessGuard],
  exports: [ClinicsService, BranchesService, StaffService, DoctorsService, ClinicAccessGuard],
})
export class ClinicsModule {}
