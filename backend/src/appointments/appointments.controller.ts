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
import { AppointmentQueryDto } from './dto/appointment-query.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentsService } from './appointments.service';

@ApiTags('Appointments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, ClinicAccessGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Schedule an appointment in a clinic' })
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR, Role.PATIENT)
  findAll(@Query() query: AppointmentQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.findAll(
      query,
      user.role === Role.PATIENT ? user.id : undefined,
    );
  }

  @Get(':appointmentId')
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR)
  findOne(
    @Query('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Param('appointmentId', new ParseUUIDPipe({ version: '4' })) appointmentId: string,
  ) {
    return this.appointmentsService.findOne(clinicId, appointmentId);
  }

  @Patch(':appointmentId')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  update(
    @Query('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Param('appointmentId', new ParseUUIDPipe({ version: '4' })) appointmentId: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(clinicId, appointmentId, dto);
  }

  @Post(':appointmentId/cancel')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  cancel(
    @Query('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Param('appointmentId', new ParseUUIDPipe({ version: '4' })) appointmentId: string,
  ) {
    return this.appointmentsService.cancel(clinicId, appointmentId);
  }

  @Post(':appointmentId/check-in')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  checkIn(
    @Query('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Param('appointmentId', new ParseUUIDPipe({ version: '4' })) appointmentId: string,
  ) {
    return this.appointmentsService.checkIn(clinicId, appointmentId);
  }
}
