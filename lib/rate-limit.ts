import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

const windowMap = new Map<string, { count: number; resetAt: number }>();

export function createRateLimiter(config: RateLimitConfig) {
  return function rateLimiter(req: NextRequest): NextResponse | null {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
    const now = Date.now();
    const key = `${ip}:${config.limit}:${config.windowMs}`;

    const entry = windowMap.get(key);
    if (!entry || now > entry.resetAt) {
      windowMap.set(key, { count: 1, resetAt: now + config.windowMs });
      return null;
    }

    entry.count++;
    if (entry.count > config.limit) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      );
    }

    return null;
  };
}

export const osceStartLimiter = createRateLimiter({ limit: 5, windowMs: 60000 });
export const osceMessageLimiter = createRateLimiter({ limit: 20, windowMs: 60000 });
export const osceEndLimiter = createRateLimiter({ limit: 5, windowMs: 60000 });
export const mcqGenerateLimiter = createRateLimiter({ limit: 5, windowMs: 60000 });
