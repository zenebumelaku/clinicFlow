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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { ClinicAccessGuard } from '../tenancy/clinic-access.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ClinicsService } from './clinics.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { ClinicResponseDto } from './dto/clinic-response.dto';

@ApiTags('Clinics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a clinic profile and assign the admin as staff' })
  @ApiResponse({ status: 201, type: ClinicResponseDto })
  @ApiResponse({ status: 403, description: 'Only ADMIN can create clinics' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateClinicDto) {
    return this.clinicsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List clinic profiles the authenticated user can access' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationQueryDto) {
    return this.clinicsService.listPaginated(user.id, query.page, query.limit);
  }

  @Get(':clinicId')
  @UseGuards(ClinicAccessGuard)
  @ApiOperation({ summary: 'Get a clinic profile (tenant-scoped)' })
  @ApiResponse({ status: 403, description: 'No access to this clinic' })
  findOne(@Param('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string) {
    return this.clinicsService.findOne(clinicId);
  }

  @Patch(':clinicId')
  @UseGuards(ClinicAccessGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update clinic profile (ADMIN of this clinic only)' })
  update(
    @Param('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Body() dto: UpdateClinicDto,
  ) {
    return this.clinicsService.update(clinicId, dto);
  }

  @Delete(':clinicId')
  @UseGuards(ClinicAccessGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate a clinic (ADMIN of this clinic only)' })
  remove(@Param('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string) {
    return this.clinicsService.remove(clinicId);
  }
}
