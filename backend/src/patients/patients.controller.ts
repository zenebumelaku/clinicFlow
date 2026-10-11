import {
  Body,
  Controller,
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
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ClinicAccessGuard } from '../tenancy/clinic-access.guard';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientQueryDto } from './dto/patient-query.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';

@ApiTags('Patients')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, ClinicAccessGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Register a patient in a clinic' })
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR)
  @ApiOperation({ summary: 'List clinic patients with pagination and search' })
  findAll(@Query() query: PatientQueryDto) {
    return this.patientsService.findAll(query);
  }

  @Get('me')
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Get the authenticated patient profile and its clinic context' })
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.patientsService.findMine(user.id);
  }

  @Get(':patientId')
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR)
  findOne(
    @Query('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Param('patientId', new ParseUUIDPipe({ version: '4' })) patientId: string,
  ) {
    return this.patientsService.findOne(clinicId, patientId);
  }

  @Patch(':patientId')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  update(
    @Query('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Param('patientId', new ParseUUIDPipe({ version: '4' })) patientId: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientsService.update(clinicId, patientId, dto);
  }
}
