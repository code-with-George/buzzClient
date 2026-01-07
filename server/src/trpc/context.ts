import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

export function createContext({ req, res }: CreateExpressContextOptions) {
  // Extract user from request (simplified - in production would verify token)
  const userId = req.headers['x-user-id'] as string | undefined;
  
  return {
    req,
    res,
    userId: userId || 'default-user',
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

