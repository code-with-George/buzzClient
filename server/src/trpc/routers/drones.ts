import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { db } from '../../db/index.js';

export const dronesRouter = router({
  // Search drones by name
  search: publicProcedure
    .input(z.object({
      query: z.string(),
    }))
    .query(async ({ input }) => {
      if (!input.query.trim()) {
        return [];
      }
      return db.searchDrones(input.query);
    }),

  // Get all available drones
  getAll: publicProcedure.query(async () => {
    return db.getAllDrones();
  }),

  // Get drone by ID
  getById: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      return db.getDroneById(input.id);
    }),

  // Get pinned drones for user
  getPinned: publicProcedure.query(async ({ ctx }) => {
    return db.getPinnedDrones(ctx.userId);
  }),

  // Pin a drone (save as template with optional config)
  pin: publicProcedure
    .input(z.object({
      droneId: z.number(),
      droneName: z.string(),
      config: z.object({
        controllerAltitude: z.number().optional(),
        controllerLat: z.number().optional(),
        controllerLng: z.number().optional(),
        droneAltitude: z.number().optional(),
        droneLat: z.number().optional(),
        droneLng: z.number().optional(),
        droneArea: z.array(z.object({ lat: z.number(), lng: z.number() })).optional(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return db.pinDrone(input.droneId, input.droneName, ctx.userId, input.config);
    }),

  // Unpin a drone
  unpin: publicProcedure
    .input(z.object({
      droneId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      db.unpinDrone(input.droneId, ctx.userId);
      return { success: true };
    }),

  // Get recently used drones (max 7)
  getRecentlyUsed: publicProcedure.query(async ({ ctx }) => {
    return db.getRecentlyUsedDrones(ctx.userId);
  }),

  // Add to recently used
  addToRecentlyUsed: publicProcedure
    .input(z.object({
      droneId: z.number(),
      droneName: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      db.addToRecentlyUsed(input.droneId, input.droneName, ctx.userId);
      return { success: true };
    }),
});
