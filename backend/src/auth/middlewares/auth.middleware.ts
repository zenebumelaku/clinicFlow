import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '../../common/config/config.service';
import { UnauthorizedException, ForbiddenException } from '../../common/exceptions/http.exceptions';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export interface JwtTokenPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

export function createAuthMiddleware(prisma: PrismaService, configService: ConfigService) {
  const secret = configService.get<string>('jwt.secret') || configService.getOrThrow<string>('JWT_SECRET');

  const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Unauthorized');
      }

      const token = authHeader.substring(7).trim();
      if (!token) {
        throw new UnauthorizedException('Unauthorized');
      }

      let payload: JwtTokenPayload;
      try {
        payload = jwt.verify(token, secret) as JwtTokenPayload;
      } catch {
        throw new UnauthorizedException('Unauthorized');
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          phone: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User account is invalid or inactive');
      }

      req.user = user;
      next();
    } catch (err) {
      next(err);
    }
  };

  return authenticate;
}

export function requireRoles(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (roles.length === 0) {
      return next();
    }

    const user = req.user;
    if (!user || !user.role) {
      throw new ForbiddenException('Access denied: insufficient permissions');
    }

    if (!roles.includes(user.role)) {
      throw new ForbiddenException(`Access denied: required one of [${roles.join(', ')}]`);
    }

    next();
  };
}
