import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ClinicAccessGuard } from '../tenancy/clinic-access.guard';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, ClinicAccessGuard)
@Roles(Role.ADMIN, Role.RECEPTIONIST)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get clinic dashboard metrics for a supported date range' })
  dashboard(@Query() query: ReportQueryDto) {
    return this.reportsService.dashboard(query);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get daily completed payment totals as chart-ready rows' })
  revenue(@Query() query: ReportQueryDto) {
    return this.reportsService.revenue(query);
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Get daily appointment counts as chart-ready rows' })
  appointments(@Query() query: ReportQueryDto) {
    return this.reportsService.appointments(query);
  }

  @Get('waiting-time')
  @ApiOperation({ summary: 'Get daily waiting and consultation averages as chart-ready rows' })
  waitingTime(@Query() query: ReportQueryDto) {
    return this.reportsService.waitingTime(query);
  }
}
