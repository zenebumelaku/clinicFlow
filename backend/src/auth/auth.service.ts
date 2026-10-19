import { Logger } from '../common/utils/logger';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '../common/exceptions/http.exceptions';
import * as bcrypt from 'bcryptjs';
import { randomBytes, randomUUID } from 'crypto';
import { DoctorAvailabilityStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { slugify } from '../common/utils/slug.util';
import { TokenService } from './token.service';
import { RegisterClinicDto } from './dto/register-clinic.dto';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { RegisterDoctorDto } from './dto/register-doctor.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import {
  AuthResponseDto,
  MessageResponseDto,
  UserResponseDto,
} from './dto/auth-response.dto';

const DUMMY_PASSWORD_HASH = bcrypt.hashSync(randomBytes(32).toString('hex'), 10);

export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly auditService: AuditService,
  ) {}

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

  async registerPatient(dto: RegisterPatientDto): Promise<AuthResponseDto> {
    const phone = dto.phone.trim();
    const email = dto.email ? dto.email.trim().toLowerCase() : null;

    let clinicId = dto.clinicId;
    if (!clinicId) {
      const defaultClinic = await this.prisma.clinic.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (!defaultClinic) {
        throw new BadRequestException('No active clinic is available for patient registration');
      }
      clinicId = defaultClinic.id;
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const medicalRecordNumber = `MR-${randomUUID().slice(0, 10).toUpperCase()}`;

    const registration = await this.prisma
      .$transaction(async (transaction) => {
        const createdUser = await transaction.user.create({
          data: {
            phone,
            email,
            passwordHash,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            role: Role.PATIENT,
          },
        });

        const createdPatient = await transaction.patient.create({
          data: {
            clinicId: clinicId!,
            userId: createdUser.id,
            medicalRecordNumber,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
            gender: dto.gender || null,
            emergencyContactName: dto.emergencyContactName || null,
            emergencyContactPhone: dto.emergencyContactPhone || null,
          },
        });

        return { user: createdUser, clinicId: clinicId!, patient: createdPatient };
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

    const { user } = registration;
    const tokens = await this.tokenService.generateTokens({
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
    });

    await this.auditService.record({
      userId: user.id,
      clinicId,
      action: 'AUTH_REGISTER_PATIENT',
      entity: 'Patient',
      entityId: registration.patient.id,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: this.mapUserResponse(user),
    };
  }

  async registerDoctor(dto: RegisterDoctorDto): Promise<AuthResponseDto> {
    const phone = dto.phone.trim();
    const email = dto.email ? dto.email.trim().toLowerCase() : null;

    let clinicId = dto.clinicId;
    if (!clinicId) {
      const defaultClinic = await this.prisma.clinic.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (!defaultClinic) {
        throw new BadRequestException('No active clinic is available for doctor registration');
      }
      clinicId = defaultClinic.id;
    } else {
      const clinic = await this.prisma.clinic.findUnique({
        where: { id: clinicId },
      });
      if (!clinic || !clinic.isActive) {
        throw new BadRequestException('Selected clinic does not exist or is inactive');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const employeeCode = `DOC-${randomUUID().slice(0, 8).toUpperCase()}`;

    const registration = await this.prisma
      .$transaction(async (transaction) => {
        const createdUser = await transaction.user.create({
          data: {
            phone,
            email,
            passwordHash,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            role: Role.DOCTOR,
          },
        });

        const staffMember = await transaction.staffMember.create({
          data: {
            clinicId: clinicId!,
            userId: createdUser.id,
            jobTitle: dto.specialization,
            employeeCode,
            isActive: true,
          },
        });

        const doctor = await transaction.doctor.create({
          data: {
            clinicId: clinicId!,
            staffMemberId: staffMember.id,
            userId: createdUser.id,
            specialization: dto.specialization.trim(),
            licenseNumber: dto.licenseNumber.trim(),
            bio: dto.bio ? dto.bio.trim() : null,
            consultationFee: dto.consultationFee ? new Prisma.Decimal(dto.consultationFee) : null,
            availabilityStatus: DoctorAvailabilityStatus.AVAILABLE,
            isActive: true,
          },
        });

        return { user: createdUser, clinicId: clinicId!, doctor };
      })
      .catch((error: unknown) => {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            'An account with this phone, email, or medical license already exists',
          );
        }
        throw error;
      });

    const { user } = registration;
    const tokens = await this.tokenService.generateTokens({
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
    });

    await this.auditService.record({
      userId: user.id,
      clinicId,
      action: 'AUTH_REGISTER_DOCTOR',
      entity: 'Doctor',
      entityId: registration.doctor.id,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: this.mapUserResponse(user),
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<MessageResponseDto> {
    const identifier = dto.identifier.trim().toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: { OR: [{ phone: identifier }, { email: identifier }] },
    });

    if (user?.isActive) {
      const passwordHash = await bcrypt.hash(dto.password, 12);
      await this.prisma.$transaction(async (transaction) => {
        await transaction.user.update({
          where: { id: user.id },
          data: { passwordHash },
        });
        await transaction.refreshToken.updateMany({
          where: { userId: user.id, isRevoked: false },
          data: { isRevoked: true },
        });
      });
      await this.auditService.record({
        userId: user.id,
        action: 'AUTH_PASSWORD_RESET',
        entity: 'User',
        entityId: user.id,
      });
    }

    return {
      success: true,
      message: 'If the account is active, its password has been reset. You can now sign in.',
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
