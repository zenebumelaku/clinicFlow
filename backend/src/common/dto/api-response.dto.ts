import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ example: true, description: 'Indicates if the request was successful' })
  success!: boolean;

  @ApiProperty({ example: 200, description: 'HTTP status code' })
  statusCode!: number;

  @ApiPropertyOptional({ example: 'Operation completed successfully' })
  message?: string;

  @ApiPropertyOptional({ description: 'Response payload' })
  data?: T;

  @ApiProperty({ example: '2026-10-08T19:30:00.000Z' })
  timestamp!: string;

  @ApiPropertyOptional({ example: 'req_123456789' })
  correlationId?: string;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success!: boolean;

  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'Bad Request' })
  message!: string;

  @ApiPropertyOptional({ example: 'Validation failed' })
  error?: string | Record<string, unknown> | unknown[];

  @ApiProperty({ example: '2026-10-08T19:30:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/api/v1/auth/login' })
  path!: string;

  @ApiPropertyOptional({ example: 'req_123456789' })
  correlationId?: string;
}
