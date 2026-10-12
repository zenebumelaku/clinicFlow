export enum HttpStatus {
  CONTINUE = 100,
  SWITCHING_PROTOCOLS = 101,
  PROCESSING = 102,
  EARLYHINTS = 103,
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NON_AUTHORITATIVE_INFORMATION = 203,
  NO_CONTENT = 204,
  RESET_CONTENT = 205,
  PARTIAL_CONTENT = 206,
  AMBIGUOUS = 300,
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  SEE_OTHER = 303,
  NOT_MODIFIED = 304,
  TEMPORARY_REDIRECT = 307,
  PERMANENT_REDIRECT = 308,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  PAYMENT_REQUIRED = 402,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  PROXY_AUTHENTICATION_REQUIRED = 407,
  REQUEST_TIMEOUT = 408,
  CONFLICT = 409,
  GONE = 410,
  LENGTH_REQUIRED = 411,
  PRECONDITION_FAILED = 412,
  PAYLOAD_TOO_LARGE = 413,
  URI_TOO_LONG = 414,
  UNSUPPORTED_MEDIA_TYPE = 415,
  REQUESTED_RANGE_NOT_SATISFIABLE = 416,
  EXPECTATION_FAILED = 417,
  I_AM_A_TEAPOT = 418,
  MISDIRECTED = 421,
  UNPROCESSABLE_ENTITY = 422,
  FAILED_DEPENDENCY = 424,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
  HTTP_VERSION_NOT_SUPPORTED = 505,
}

export class HttpException extends Error {
  private readonly response: string | Record<string, unknown>;
  private readonly status: number;

  constructor(response: string | Record<string, unknown>, status: number) {
    super(typeof response === 'string' ? response : (response.message as string) || 'Http Exception');
    this.name = 'HttpException';
    this.response = response;
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  getResponse(): string | Record<string, unknown> {
    return this.response;
  }

  getStatus(): number {
    return this.status;
  }
}

export class BadRequestException extends HttpException {
  constructor(objectOrError?: string | Record<string, unknown> | unknown[]) {
    super(
      typeof objectOrError === 'object' && objectOrError !== null
        ? (objectOrError as Record<string, unknown>)
        : objectOrError || 'Bad Request',
      HttpStatus.BAD_REQUEST,
    );
    this.name = 'BadRequestException';
  }
}

export class UnauthorizedException extends HttpException {
  constructor(objectOrError?: string | Record<string, unknown>) {
    super(
      typeof objectOrError === 'object' && objectOrError !== null
        ? objectOrError
        : objectOrError || 'Unauthorized',
      HttpStatus.UNAUTHORIZED,
    );
    this.name = 'UnauthorizedException';
  }
}

export class ForbiddenException extends HttpException {
  constructor(objectOrError?: string | Record<string, unknown>) {
    super(
      typeof objectOrError === 'object' && objectOrError !== null
        ? objectOrError
        : objectOrError || 'Forbidden',
      HttpStatus.FORBIDDEN,
    );
    this.name = 'ForbiddenException';
  }
}

export class NotFoundException extends HttpException {
  constructor(objectOrError?: string | Record<string, unknown>) {
    super(
      typeof objectOrError === 'object' && objectOrError !== null
        ? objectOrError
        : objectOrError || 'Not Found',
      HttpStatus.NOT_FOUND,
    );
    this.name = 'NotFoundException';
  }
}

export class ConflictException extends HttpException {
  constructor(objectOrError?: string | Record<string, unknown>) {
    super(
      typeof objectOrError === 'object' && objectOrError !== null
        ? objectOrError
        : objectOrError || 'Conflict',
      HttpStatus.CONFLICT,
    );
    this.name = 'ConflictException';
  }
}

export class ServiceUnavailableException extends HttpException {
  constructor(objectOrError?: string | Record<string, unknown>) {
    super(
      typeof objectOrError === 'object' && objectOrError !== null
        ? objectOrError
        : objectOrError || 'Service Unavailable',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
    this.name = 'ServiceUnavailableException';
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(objectOrError?: string | Record<string, unknown>) {
    super(
      typeof objectOrError === 'object' && objectOrError !== null
        ? objectOrError
        : objectOrError || 'Internal Server Error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    this.name = 'InternalServerErrorException';
  }
}
