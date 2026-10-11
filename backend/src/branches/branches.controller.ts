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
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { ClinicAccessGuard } from '../tenancy/clinic-access.guard';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchResponseDto } from './dto/branch-response.dto';

@ApiTags('Branches')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, ClinicAccessGuard)
@Controller('clinics/:clinicId/branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a branch for the clinic' })
  create(
    @Param('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Body() dto: CreateBranchDto,
  ): Promise<BranchResponseDto> {
    return this.branchesService.create(clinicId, dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR)
  @ApiOperation({ summary: 'List branches for the authenticated clinic' })
  findAll(
    @Param('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.branchesService.findAll(clinicId, query);
  }

  @Get(':branchId')
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR)
  @ApiOperation({ summary: 'Get a branch in the clinic' })
  findOne(
    @Param('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Param('branchId', new ParseUUIDPipe({ version: '4' })) branchId: string,
  ) {
    return this.branchesService.findOne(clinicId, branchId);
  }

  @Patch(':branchId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a clinic branch' })
  update(
    @Param('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Param('branchId', new ParseUUIDPipe({ version: '4' })) branchId: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchesService.update(clinicId, branchId, dto);
  }

  @Delete(':branchId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate a clinic branch' })
  remove(
    @Param('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Param('branchId', new ParseUUIDPipe({ version: '4' })) branchId: string,
  ) {
    return this.branchesService.remove(clinicId, branchId);
  }
}
