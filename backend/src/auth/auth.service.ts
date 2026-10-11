import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { OtpPurpose, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OtpService } from './otp/otp.service';
import { TokenService } from './token.service';
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

const DUMMY_PASSWORD_HASH = bcrypt.hashSync(randomBytes(32).toString('hex'), 10);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Dispatches OTP for phone/email authentication
   */
  async sendOtp(dto: SendOtpDto): Promise<SendOtpResponseDto> {
    const result = await this.otpService.sendOtp(dto.identifier, dto.purpose || OtpPurpose.LOGIN);
    return result;
  }

  /**
   * Verifies OTP, auto-creates patient if new, and issues JWT + Refresh tokens
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<AuthResponseDto> {
    const verification = await this.otpService.verifyOtp(
      dto.identifier,
      dto.code,
      dto.purpose || OtpPurpose.LOGIN,
    );

    const normalizedId = verification.identifier;

    // Locate existing user by phone or email
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ phone: normalizedId }, { email: normalizedId }],
      },
    });

    if (!user) {
      // Auto-register new patient user upon first OTP verification
      const isEmail = normalizedId.includes('@');
      const phone = isEmail
        ? dto.identifier.startsWith('+')
          ? dto.identifier
          : `phone-${Date.now()}`
        : normalizedId;
      const email = isEmail ? normalizedId : dto.email || null;

      user = await this.prisma.user.create({
        data: {
          phone,
          email,
          firstName: dto.firstName || 'Patient',
          lastName: dto.lastName || 'User',
          role: Role.PATIENT,
          isActive: true,
        },
      });

      this.logger.log('Created new PATIENT account after OTP verification');
    } else if (!user.isActive) {
      throw new UnauthorizedException('User account has been deactivated');
    }

    const tokens = await this.tokenService.generateTokens({
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
    });

    await this.auditService.record({
      userId: user.id,
      action: 'AUTH_VERIFY_OTP',
      entity: 'User',
      entityId: user.id,
      details: JSON.stringify({ purpose: dto.purpose || OtpPurpose.LOGIN, role: user.role }),
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: this.mapUserResponse(user),
    };
  }

  /**
   * Authenticates user via identifier (phone or email) and password
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const normalizedIdentifier = dto.identifier.trim().toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ phone: normalizedIdentifier }, { email: normalizedIdentifier }],
      },
    });

    const isMatch = await bcrypt.compare(dto.password, user?.passwordHash || DUMMY_PASSWORD_HASH);
    if (!user || !user.isActive || !user.passwordHash || !isMatch) {
      throw new UnauthorizedException('Invalid identifier or password');
    }

    const tokens = await this.tokenService.generateTokens({
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
    });

    await this.auditService.record({
      userId: user.id,
      action: 'AUTH_LOGIN',
      entity: 'User',
      entityId: user.id,
      details: JSON.stringify({ role: user.role }),
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: this.mapUserResponse(user),
    };
  }

  /**
   * Rotates refresh tokens and returns new access + refresh token pair
   */
  async refresh(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    const rotated = await this.tokenService.rotateTokens(dto.refreshToken);

    const user = await this.prisma.user.findUnique({
      where: { id: rotated.userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is invalid or inactive');
    }

    await this.auditService.record({
      userId: user.id,
      action: 'AUTH_REFRESH',
      entity: 'User',
      entityId: user.id,
      details: JSON.stringify({ role: user.role }),
    });

    return {
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
      expiresIn: rotated.expiresIn,
      user: this.mapUserResponse(user),
    };
  }

  /**
   * Logs out user by revoking refresh token(s)
   */
  async logout(userId?: string, dto?: LogoutDto): Promise<MessageResponseDto> {
    if (dto?.refreshToken) {
      await this.tokenService.revokeRefreshToken(dto.refreshToken);
    } else if (userId) {
      await this.tokenService.revokeAllUserTokens(userId);
    }

    await this.auditService.record({
      userId: userId || null,
      action: 'AUTH_LOGOUT',
      entity: 'User',
      entityId: userId || null,
    });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  /**
   * Fetches profile for authenticated user
   */
  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return this.mapUserResponse(user);
  }

  /**
   * Helper to format User entity to UserResponseDto
   */
  private mapUserResponse(user: {
    id: string;
    phone: string;
    email: string | null;
    firstName: string;
    lastName: string;
    role: Role;
    isActive: boolean;
    createdAt: Date;
  }): UserResponseDto {
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
