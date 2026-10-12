import { Request, Response, NextFunction } from 'express';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { BadRequestException } from '../exceptions/http.exceptions';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function extractValidationErrors(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  for (const error of errors) {
    if (error.constraints) {
      messages.push(...Object.values(error.constraints));
    }
    if (error.children && error.children.length > 0) {
      messages.push(...extractValidationErrors(error.children));
    }
  }
  return messages;
}

export function validateBody<T extends object>(dtoClass: ClassConstructor<T>) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const instance = plainToInstance(dtoClass, req.body || {}, {
        enableImplicitConversion: true,
      });

      const errors = await validate(instance, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      if (errors.length > 0) {
        const messages = extractValidationErrors(errors);
        throw new BadRequestException(messages);
      }

      req.body = instance;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function validateQuery<T extends object>(dtoClass: ClassConstructor<T>) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const instance = plainToInstance(dtoClass, req.query || {}, {
        enableImplicitConversion: true,
      });

      const errors = await validate(instance, {
        whitelist: true,
        forbidNonWhitelisted: false,
      });

      if (errors.length > 0) {
        const messages = extractValidationErrors(errors);
        throw new BadRequestException(messages);
      }

      req.query = instance as unknown as Request['query'];
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function validateUuidParam(...paramNames: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    for (const param of paramNames) {
      const value = req.params[param];
      if (value && !UUID_V4.test(value)) {
        throw new BadRequestException(`Validation failed (uuid v4 is expected)`);
      }
    }
    next();
  };
}
