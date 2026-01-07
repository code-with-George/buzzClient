import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { db } from '../../db/index.js';

export const authRouter = router({
  // Login with serial number
  login: publicProcedure
    .input(z.object({
      serialNumber: z.string().min(1, 'Serial number is required'),
    }))
    .mutation(async ({ input }) => {
      let user = db.findUserBySerialNumber(input.serialNumber);

      if (!user) {
        // Create a new user if not found
        user = db.createUser(input.serialNumber, `Operator ${input.serialNumber}`);
      }

      return {
        success: true,
        user,
        token: `token-${user.id}`, // Simplified token for demo
      };
    }),

  // Verify token (simplified)
  verify: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .query(async ({ input }) => {
      // Extract user ID from token (simplified)
      const userId = parseInt(input.token.replace('token-', ''));
      const user = db.findUserById(userId);

      return {
        valid: !!user,
        user,
      };
    }),
});
