import { Logger } from '../common/utils/logger';
import { UnauthorizedException } from '../common/exceptions/http.exceptions';
import { ConfigAccessor } from '../common/config/config.service';
import { JwtService } from './jwt.service';
import { createHash, randomBytes } from 'crypto';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface TokenPayload {
  sub: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresDays: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigAccessor,
  ) {
    this.accessExpiresIn =
      this.configService.get<string>('jwt.expiresIn') ||
      this.configService.get<string>('JWT_EXPIRES_IN') ||
      '15m';
    this.refreshExpiresDays =
      this.configService.get<number>('jwt.refreshExpiresDays') ||
      this.configService.get<number>('JWT_REFRESH_EXPIRES_DAYS') ||
      7;
  }

  /**
   * Generates both an Access Token (JWT) and a securely hashed Refresh Token
   */
  async generateTokens(user: {
    id: string;
    phone: string;
    email?: string | null;
    role: Role;
  }): Promise<TokenPair> {
    return this.issueTokenPair(user, (data) => this.prisma.refreshToken.create({ data }));
  }

  private async issueTokenPair(
    user: { id: string; phone: string; email?: string | null; role: Role },
    persist: (data: {
      tokenHash: string;
      userId: string;
      expiresAt: Date;
      isRevoked: false;
    }) => Promise<unknown>,
  ): Promise<TokenPair> {
    const payload: TokenPayload = { sub: user.id };

    // 1. Issue JWT access token
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.accessExpiresIn,
    });

    // 2. Generate random refresh token & hash it
    const rawRefreshToken = randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);

    const expiresAt = new Date(Date.now() + this.refreshExpiresDays * 24 * 60 * 60 * 1000);

    // 3. Persist hashed refresh token
    await persist({
      tokenHash,
      userId: user.id,
      expiresAt,
      isRevoked: false,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: this.accessExpiresIn,
    };
  }

  /**
   * Rotates refresh tokens:
   * Validates active token, revokes previous token, and issues new token pair
   */
  async rotateTokens(rawRefreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
    userId: string;
  }> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const result = await this.prisma.$transaction(
      async (transaction) => {
        const record = await transaction.refreshToken.findUnique({
          where: { tokenHash },
          include: { user: true },
        });
        if (!record) throw new UnauthorizedException('Invalid refresh token');
        if (record.isRevoked) return { replayedUserId: record.userId };
        if (new Date() > record.expiresAt) {
          throw new UnauthorizedException('Refresh token has expired');
        }
        if (!record.user.isActive) {
          throw new UnauthorizedException('User account is inactive');
        }

        const consumed = await transaction.refreshToken.updateMany({
          where: { id: record.id, isRevoked: false },
          data: { isRevoked: true },
        });
        if (consumed.count !== 1) return { replayedUserId: record.userId };

        const tokens = await this.issueTokenPair(
          {
            id: record.user.id,
            phone: record.user.phone,
            email: record.user.email,
            role: record.user.role,
          },
          (data) => transaction.refreshToken.create({ data }),
        );
        return { tokens, userId: record.user.id };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if ('replayedUserId' in result && result.replayedUserId) {
      this.logger.warn('Refresh token reuse detected; revoking remaining user sessions');
      await this.revokeAllUserTokens(result.replayedUserId);
      throw new UnauthorizedException('Refresh token has been revoked. All sessions invalidated.');
    }
    if (!result.tokens || !result.userId) {
      throw new UnauthorizedException('Refresh token rotation failed');
    }
    return { ...result.tokens, userId: result.userId };
  }

  /**
   * Revokes a specific refresh token (used on logout)
   */
  async revokeRefreshToken(rawRefreshToken: string): Promise<boolean> {
    const tokenHash = this.hashToken(rawRefreshToken);

    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (record && !record.isRevoked) {
      await this.prisma.refreshToken.update({
        where: { id: record.id },
        data: { isRevoked: true },
      });
      return true;
    }

    return false;
  }

  /**
   * Revokes all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  /**
   * Hashes raw token using SHA-256
   */
  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}
