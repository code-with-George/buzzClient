import { createTRPCReact, httpBatchLink } from '@trpc/react-query';
import type { AppRouter } from '../../../server/src/trpc/routers/index';

export const trpc = createTRPCReact<AppRouter>();

// Get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('buzz-token');
}

// Get user ID from localStorage
function getUserId(): string {
  return localStorage.getItem('buzz-user-id') || 'default-user';
}

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/trpc',
      headers() {
        const token = getAuthToken();
        return {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-user-id': getUserId(),
        };
      },
    }),
  ],
});

