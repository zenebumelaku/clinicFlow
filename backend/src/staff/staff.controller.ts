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
import { ClinicAccessGuard } from '../tenancy/clinic-access.guard';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffQueryDto } from './dto/staff-query.dto';

@ApiTags('Staff')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, ClinicAccessGuard)
@Controller('clinics/:clinicId/staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Add a staff member to the clinic' })
  create(
    @Param('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Body() dto: CreateStaffDto,
  ) {
    return this.staffService.create(clinicId, dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'List staff members for the clinic' })
  findAll(
    @Param('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Query() query: StaffQueryDto,
  ) {
    return this.staffService.findAll(clinicId, query);
  }

  @Get(':staffId')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Get a staff member in the clinic' })
  findOne(
    @Param('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Param('staffId', new ParseUUIDPipe({ version: '4' })) staffId: string,
  ) {
    return this.staffService.findOne(clinicId, staffId);
  }

  @Patch(':staffId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a staff member' })
  update(
    @Param('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Param('staffId', new ParseUUIDPipe({ version: '4' })) staffId: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.staffService.update(clinicId, staffId, dto);
  }

  @Delete(':staffId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate a staff member' })
  remove(
    @Param('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Param('staffId', new ParseUUIDPipe({ version: '4' })) staffId: string,
  ) {
    return this.staffService.remove(clinicId, staffId);
  }
}
