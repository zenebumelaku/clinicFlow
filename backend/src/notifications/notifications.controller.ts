import { Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications belonging to the authenticated user and clinic' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: NotificationQueryDto) {
    return this.notificationsService.findAll(user.id, query);
  }

  @Patch(':notificationId/read')
  @ApiOperation({ summary: 'Mark one of the authenticated user’s clinic notifications as read' })
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Query('clinicId', new ParseUUIDPipe({ version: '4' })) clinicId: string,
    @Param('notificationId', new ParseUUIDPipe({ version: '4' })) notificationId: string,
  ) {
    return this.notificationsService.markRead(user.id, clinicId, notificationId);
  }
}
