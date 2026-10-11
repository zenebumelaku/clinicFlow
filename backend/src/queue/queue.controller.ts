import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { CheckInQueueDto } from './dto/check-in-queue.dto';
import { QueueQueryDto } from './dto/queue-query.dto';
import { QueueService } from './queue.service';

@ApiTags('Clinic Queue')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, ClinicAccessGuard)
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR, Role.PATIENT)
  @ApiOperation({ summary: 'Get a clinic queue, optionally filtered by date, status, and doctor' })
  findAll(@Query() query: QueueQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.queueService.findAll(
      query,
      user.role === Role.PATIENT ? user.id : undefined,
    );
  }

  @Post('check-in')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Check in a clinic patient and assign the next daily queue number' })
  checkIn(@Body() dto: CheckInQueueDto) {
    return this.queueService.checkIn(dto);
  }

  @Post(':ticketId/call')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  call(
    @Query('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Param('ticketId', new ParseUUIDPipe({ version: '4' })) ticketId: string,
  ) {
    return this.queueService.call(clinicId, ticketId);
  }

  @Post(':ticketId/start')
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR)
  start(
    @Query('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Param('ticketId', new ParseUUIDPipe({ version: '4' })) ticketId: string,
  ) {
    return this.queueService.start(clinicId, ticketId);
  }

  @Post(':ticketId/complete')
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR)
  complete(
    @Query('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Param('ticketId', new ParseUUIDPipe({ version: '4' })) ticketId: string,
  ) {
    return this.queueService.complete(clinicId, ticketId);
  }

  @Post(':ticketId/skip')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  skip(
    @Query('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Param('ticketId', new ParseUUIDPipe({ version: '4' })) ticketId: string,
  ) {
    return this.queueService.skip(clinicId, ticketId);
  }
}
