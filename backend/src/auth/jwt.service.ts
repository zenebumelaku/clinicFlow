import * as jwt from 'jsonwebtoken';

export interface JwtSignOptions extends jwt.SignOptions {
  secret?: string;
}

export class JwtService {
  private readonly defaultSecret: string;

  constructor(options?: { secret?: string; signOptions?: jwt.SignOptions }) {
    this.defaultSecret = options?.secret || process.env.JWT_SECRET || 'default-jwt-secret-at-least-32-chars-long';
  }

  async signAsync(payload: string | object | Buffer, options?: JwtSignOptions): Promise<string> {
    return this.sign(payload, options);
  }

  sign(payload: string | object | Buffer, options?: JwtSignOptions): string {
    const secret = options?.secret || this.defaultSecret;
    const signOpts: jwt.SignOptions = { ...options };
    delete (signOpts as { secret?: string }).secret;
    return jwt.sign(payload, secret, signOpts);
  }

  async verifyAsync<T extends object = any>(token: string, options?: jwt.VerifyOptions & { secret?: string }): Promise<T> {
    return this.verify<T>(token, options);
  }

  verify<T extends object = any>(token: string, options?: jwt.VerifyOptions & { secret?: string }): T {
    const secret = options?.secret || this.defaultSecret;
    return jwt.verify(token, secret, options) as T;
  }
}
