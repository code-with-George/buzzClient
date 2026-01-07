import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { db } from '../../db/index.js';

// Configuration schema for validation
const configurationSchema = z.object({
  droneId: z.number(),
  droneName: z.string(),
  controller: z.object({
    altitude: z.number().positive('Controller altitude must be positive'),
    lat: z.number(),
    lng: z.number(),
  }),
  drone: z.object({
    altitude: z.number().positive('Drone altitude must be positive'),
    lat: z.number(),
    lng: z.number(),
    radius: z.number().positive('Operational radius must be positive'),
  }),
});

// Generate mock base64 PNG image with green/red communication zones
function generateMockCalculationImage(radius: number): string {
  const size = 300;
  
  // Create a simple SVG converted to base64 as placeholder
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <radialGradient id="commGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:#22c55e;stop-opacity:0.8" />
          <stop offset="40%" style="stop-color:#22c55e;stop-opacity:0.6" />
          <stop offset="60%" style="stop-color:#eab308;stop-opacity:0.5" />
          <stop offset="80%" style="stop-color:#ef4444;stop-opacity:0.4" />
          <stop offset="100%" style="stop-color:#ef4444;stop-opacity:0.2" />
        </radialGradient>
        <clipPath id="circleClip">
          <circle cx="${size/2}" cy="${size/2}" r="${size/2}" />
        </clipPath>
      </defs>
      <g clip-path="url(#circleClip)">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="url(#commGradient)" />
        <ellipse cx="${size * 0.3}" cy="${size * 0.6}" rx="${size * 0.15}" ry="${size * 0.1}" fill="#ef4444" opacity="0.6" />
        <ellipse cx="${size * 0.7}" cy="${size * 0.3}" rx="${size * 0.12}" ry="${size * 0.18}" fill="#ef4444" opacity="0.5" />
        <circle cx="${size * 0.5}" cy="${size * 0.8}" r="${size * 0.08}" fill="#ef4444" opacity="0.7" />
      </g>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export const flightRouter = router({
  // Calculate communication zones
  calculate: publicProcedure
    .input(configurationSchema)
    .mutation(async ({ input }) => {
      // Simulate calculation delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate mock image
      const imageData = generateMockCalculationImage(input.drone.radius);

      return {
        success: true,
        imageData,
        calculatedAt: new Date().toISOString(),
      };
    }),

  // Request control center approval
  requestApproval: publicProcedure
    .input(z.object({
      droneId: z.number(),
      droneName: z.string(),
    }))
    .mutation(async () => {
      // Simulate control center response delay
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Random approval (80% chance of approval for demo)
      const approved = Math.random() > 0.2;

      return {
        approved,
        message: approved 
          ? 'Control center has approved the launch' 
          : 'Control center has denied the launch request',
        respondedAt: new Date().toISOString(),
      };
    }),

  // Save flight to history
  saveToHistory: publicProcedure
    .input(z.object({
      droneId: z.number(),
      droneName: z.string(),
      droneType: z.string(),
      controllerAltitude: z.number(),
      controllerLat: z.number(),
      controllerLng: z.number(),
      droneAltitude: z.number(),
      droneLat: z.number(),
      droneLng: z.number(),
      operationalRadius: z.number(),
      status: z.enum(['Launched', 'Not Launched']),
      controlCenterApproved: z.boolean().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      const flightId = db.saveFlightHistory({
        drone_id: input.droneId,
        drone_name: input.droneName,
        drone_type: input.droneType,
        user_id: ctx.userId,
        controller_altitude: input.controllerAltitude,
        controller_lat: input.controllerLat,
        controller_lng: input.controllerLng,
        drone_altitude: input.droneAltitude,
        drone_lat: input.droneLat,
        drone_lng: input.droneLng,
        operational_radius: input.operationalRadius,
        status: input.status,
        control_center_approved: input.controlCenterApproved,
      });

      return {
        success: true,
        flightId,
      };
    }),

  // Get flight history (launched drones)
  getHistory: publicProcedure.query(async ({ ctx }) => {
    return db.getFlightHistory(ctx.userId);
  }),
});
