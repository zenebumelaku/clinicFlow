/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
export function ApiProperty(options?: Record<string, unknown>): PropertyDecorator {
  return () => {};
}

export function ApiPropertyOptional(options?: Record<string, unknown>): PropertyDecorator {
  return () => {};
}

export function ApiOperation(options?: Record<string, unknown>): MethodDecorator {
  return () => {};
}

export function ApiResponse(options?: Record<string, unknown>): MethodDecorator {
  return () => {};
}

export function ApiTags(...tags: string[]): ClassDecorator {
  return () => {};
}

export function ApiBearerAuth(name?: string): MethodDecorator & ClassDecorator {
  return (() => {}) as MethodDecorator & ClassDecorator;
}

export function PartialType<T>(classRef: new () => T): new () => Partial<T> {
  return class extends (classRef as any) {} as any;
}
/* eslint-enable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
