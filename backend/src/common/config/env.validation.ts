import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  ValidateIf,
  validateSync,
} from 'class-validator';
import { Environment } from '../enums/environment.enum';

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsInt()
  @Min(1)
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32, { message: 'JWT_SECRET must be at least 32 characters long' })
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '15m';

  @IsInt()
  @Min(1)
  @IsOptional()
  JWT_REFRESH_EXPIRES_DAYS: number = 7;

  @ValidateIf((env: EnvironmentVariables) => env.NODE_ENV === Environment.Production)
  @IsString()
  @IsNotEmpty({ message: 'CORS_ORIGIN must be set to explicit origins in production' })
  @IsOptional()
  CORS_ORIGIN: string = '*';

  @IsInt()
  @Min(1000)
  @IsOptional()
  THROTTLE_TTL: number = 60000;

  @IsInt()
  @Min(1)
  @IsOptional()
  THROTTLE_LIMIT: number = 100;

  @IsInt()
  @Min(0)
  @Max(8)
  @IsOptional()
  TRUST_PROXY_HOPS: number = 0;

  @IsString()
  @IsOptional()
  API_PREFIX: string = 'api/v1';

  @IsString()
  @IsOptional()
  SWAGGER_PATH: string = 'api/docs';

  @Transform(({ value }) => {
    if (value === undefined || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return String(value).toLowerCase() === 'true';
  })
  @IsBoolean()
  @IsOptional()
  SWAGGER_ENABLED?: boolean;

  @IsString()
  @IsOptional()
  CHAPA_SECRET_KEY?: string;

  @IsString()
  @IsOptional()
  CHAPA_BASE_URL?: string = 'https://api.chapa.co/v1';

  @IsString()
  @IsOptional()
  CHAPA_WEBHOOK_SECRET?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  if (
    validatedConfig.NODE_ENV === Environment.Production &&
    (!validatedConfig.CORS_ORIGIN || validatedConfig.CORS_ORIGIN.trim() === '*')
  ) {
    throw new Error(
      'Environment validation failed: CORS_ORIGIN must list explicit origins in production',
    );
  }


  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const formattedErrors = errors
      .map((error) => Object.values(error.constraints || {}).join(', '))
      .join('; ');
    throw new Error(`Environment validation failed: ${formattedErrors}`);
  }

  return validatedConfig;
}
