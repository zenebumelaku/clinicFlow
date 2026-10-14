import { Logger } from '../common/utils/logger';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '../common/exceptions/http.exceptions';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { OtpPurpose, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { slugify } from '../common/utils/slug.util';
import { OtpService } from './otp/otp.service';
import { TokenService } from './token.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RegisterClinicDto } from './dto/register-clinic.dto';
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

  async registerClinic(dto: RegisterClinicDto): Promise<AuthResponseDto> {
    const phone = dto.phone.trim().toLowerCase();
    const email = dto.email?.trim().toLowerCase() || null;
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ phone }, ...(email ? [{ email }] : [])],
      },
    });
    if (existingUser) {
      throw new ConflictException('An account already exists for this phone number or email address');
    }

    const verification = await this.otpService.verifyOtp(
      phone,
      dto.code,
      OtpPurpose.REGISTRATION,
    );
    if (verification.identifier !== phone) {
      throw new UnauthorizedException('Phone number verification failed');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const registration = await this.prisma
      .$transaction(async (transaction) => {
        const createdUser = await transaction.user.create({
          data: {
            phone,
            email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: Role.ADMIN,
            isActive: true,
          },
        });

        const baseSlug = slugify(dto.clinicName);
        let slug = baseSlug;
        let suffix = 0;
        while (await transaction.clinic.findUnique({ where: { slug } })) {
          suffix += 1;
          slug = `${baseSlug}-${suffix}`;
        }

        const clinic = await transaction.clinic.create({
          data: {
            name: dto.clinicName,
            slug,
            phone: dto.clinicPhone?.trim() || phone,
            email,
            address: dto.clinicAddress || null,
            city: dto.clinicCity || null,
          },
        });

        await transaction.staffMember.create({
          data: {
            clinicId: clinic.id,
            userId: createdUser.id,
            jobTitle: 'Clinic Administrator',
            isActive: true,
          },
        });

        return { user: createdUser, clinicId: clinic.id };
      })
      .catch((error: unknown) => {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            'An account already exists for this phone number or email address',
          );
        }
        throw error;
      });
    const { user, clinicId } = registration;

    const tokens = await this.tokenService.generateTokens({
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
    });

    await this.auditService.record({
      userId: user.id,
      clinicId,
      action: 'AUTH_REGISTER_CLINIC',
      entity: 'Clinic',
      entityId: clinicId,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: this.mapUserResponse(user),
    };
  }

  /**
   * Verifies OTP, auto-creates patient if new, and issues JWT + Refresh tokens
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<AuthResponseDto> {
    const purpose = dto.purpose || OtpPurpose.LOGIN;
    if (purpose !== OtpPurpose.LOGIN) {
      throw new BadRequestException(
        'Use the appropriate account flow to complete this verification',
      );
    }

    const verification = await this.otpService.verifyOtp(
      dto.identifier,
      dto.code,
      purpose,
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
      details: JSON.stringify({ purpose, role: user.role }),
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
