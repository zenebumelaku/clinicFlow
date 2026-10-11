import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ClinicAccessGuard } from '../tenancy/clinic-access.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { UpdateDoctorAvailabilityDto } from './dto/update-doctor-availability.dto';
import { DoctorQueryDto } from './dto/doctor-query.dto';

@ApiTags('Doctors')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, ClinicAccessGuard)
@Controller('clinics/:clinicId/doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a doctor profile with specialization' })
  create(
    @Param('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Body() dto: CreateDoctorDto,
  ) {
    return this.doctorsService.create(clinicId, dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR)
  @ApiOperation({ summary: 'List doctors, filterable by specialization and availability' })
  findAll(
    @Param('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Query() query: DoctorQueryDto,
  ) {
    return this.doctorsService.findAll(clinicId, query);
  }

  @Get(':doctorId')
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR)
  @ApiOperation({ summary: 'Get a doctor in the clinic' })
  findOne(
    @Param('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Param('doctorId', new ParseUUIDPipe({ version: '4' })) doctorId: string,
  ) {
    return this.doctorsService.findOne(clinicId, doctorId);
  }

  @Patch(':doctorId')
  @Roles(Role.ADMIN, Role.DOCTOR)
  @ApiOperation({ summary: 'Update doctor specialization, bio, or profile fields' })
  update(
    @Param('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Param('doctorId', new ParseUUIDPipe({ version: '4' })) doctorId: string,
    @Body() dto: UpdateDoctorDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.doctorsService.update(clinicId, doctorId, dto, user);
  }

  @Patch(':doctorId/availability')
  @Roles(Role.ADMIN, Role.DOCTOR)
  @ApiOperation({ summary: 'Update doctor availability status' })
  updateAvailability(
    @Param('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Param('doctorId', new ParseUUIDPipe({ version: '4' })) doctorId: string,
    @Body() dto: UpdateDoctorAvailabilityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.doctorsService.updateAvailability(clinicId, doctorId, dto.availabilityStatus, user);
  }

  @Delete(':doctorId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate a doctor' })
  remove(
    @Param('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Param('doctorId', new ParseUUIDPipe({ version: '4' })) doctorId: string,
  ) {
    return this.doctorsService.remove(clinicId, doctorId);
  }
}
