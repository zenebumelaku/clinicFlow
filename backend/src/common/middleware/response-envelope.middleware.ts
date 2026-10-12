import { Request, Response, NextFunction } from 'express';

export function responseEnvelopeMiddleware(req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);

  res.json = function (body: unknown): Response {
    // Check if enveloping should be skipped (e.g. swagger, raw docs, or already enveloped)
    const isDoc = req.path.includes('/docs') || req.path.includes('/api/docs');
    const isAlreadyEnveloped =
      body !== null &&
      typeof body === 'object' &&
      'success' in body &&
      'statusCode' in body &&
      'timestamp' in body;

    if (isDoc || isAlreadyEnveloped) {
      return originalJson(body);
    }

    const statusCode = res.statusCode || 200;
    const timestamp = new Date().toISOString();
    const correlationId = req.correlationId;

    if (body === undefined || body === null) {
      return originalJson({
        success: true,
        statusCode,
        data: null,
        timestamp,
        ...(correlationId ? { correlationId } : {}),
      });
    }

    if (typeof body === 'object' && 'data' in body && 'meta' in body) {
      const paginated = body as { data: unknown; meta: unknown };
      return originalJson({
        success: true,
        statusCode,
        data: paginated.data,
        meta: paginated.meta,
        timestamp,
        ...(correlationId ? { correlationId } : {}),
      });
    }

    return originalJson({
      success: true,
      statusCode,
      data: body,
      timestamp,
      ...(correlationId ? { correlationId } : {}),
    });
  };

  next();
}
