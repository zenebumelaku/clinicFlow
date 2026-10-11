import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import {
  AuthResponseDto,
  MessageResponseDto,
  SendOtpResponseDto,
  UserResponseDto,
} from './dto/auth-response.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@ApiTags('Authentication & Authorization')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send 6-digit OTP code to phone number or email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP dispatched successfully',
    type: SendOtpResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Rate limit cooldown active or invalid identifier',
  })
  async sendOtp(@Body() dto: SendOtpDto): Promise<SendOtpResponseDto> {
    return this.authService.sendOtp(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code and authenticate (issues JWT & Refresh Token)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP verified and user authenticated',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid, expired, or locked OTP code',
  })
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<AuthResponseDto> {
    return this.authService.verifyOtp(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with phone/email and password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User authenticated successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or inactive account',
  })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new token pair' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens successfully rotated',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid, revoked, or expired refresh token',
  })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refresh(dto);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke refresh token and terminate session' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logged out successfully',
    type: MessageResponseDto,
  })
  async logout(@Body() dto: LogoutDto, @Req() req: Request): Promise<MessageResponseDto> {
    const user = req.user as { id?: string } | undefined;
    return this.authService.logout(user?.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get profile of current authenticated user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid access token',
  })
  async getProfile(@CurrentUser('id') userId: string): Promise<UserResponseDto> {
    return this.authService.getProfile(userId);
  }

  // ==========================================
  // Role-Based Access Control Test Endpoints
  // ==========================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('test/admin-only')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'RBAC verification: accessible only to ADMIN role' })
  @ApiResponse({ status: 200, description: 'Access granted to ADMIN' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions' })
  adminOnly(@CurrentUser() user: unknown) {
    return {
      message: 'Access granted to ADMIN resource',
      user,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR)
  @Get('test/doctor-only')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'RBAC verification: accessible only to DOCTOR role' })
  @ApiResponse({ status: 200, description: 'Access granted to DOCTOR' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions' })
  doctorOnly(@CurrentUser() user: unknown) {
    return {
      message: 'Access granted to DOCTOR resource',
      user,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECEPTIONIST)
  @Get('test/receptionist-only')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'RBAC verification: accessible only to RECEPTIONIST role' })
  @ApiResponse({ status: 200, description: 'Access granted to RECEPTIONIST' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions' })
  receptionistOnly(@CurrentUser() user: unknown) {
    return {
      message: 'Access granted to RECEPTIONIST resource',
      user,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @Get('test/patient-only')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'RBAC verification: accessible only to PATIENT role' })
  @ApiResponse({ status: 200, description: 'Access granted to PATIENT' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient permissions' })
  patientOnly(@CurrentUser() user: unknown) {
    return {
      message: 'Access granted to PATIENT resource',
      user,
    };
  }
}
