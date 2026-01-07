import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { db } from '../../db/index.js';

// Coordinate schema
const coordinateSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

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
    area: z.array(coordinateSchema).min(3, 'Area must have at least 3 points'),
  }),
});

// Generate mock base64 PNG image with green/red communication zones
function generateMockCalculationImage(area: { lat: number; lng: number }[]): string {
  // Calculate bounds of the polygon
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;
  
  for (const coord of area) {
    minLat = Math.min(minLat, coord.lat);
    maxLat = Math.max(maxLat, coord.lat);
    minLng = Math.min(minLng, coord.lng);
    maxLng = Math.max(maxLng, coord.lng);
  }
  
  const size = 400;
  const latRange = maxLat - minLat;
  const lngRange = maxLng - minLng;
  
  // Convert polygon coordinates to SVG points
  const svgPoints = area.map(coord => {
    const x = ((coord.lng - minLng) / lngRange) * size;
    const y = ((maxLat - coord.lat) / latRange) * size; // Flip Y axis
    return `${x},${y}`;
  }).join(' ');
  
  // Create SVG with polygon shape
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <linearGradient id="commGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#22c55e;stop-opacity:0.8" />
          <stop offset="30%" style="stop-color:#22c55e;stop-opacity:0.6" />
          <stop offset="50%" style="stop-color:#eab308;stop-opacity:0.5" />
          <stop offset="70%" style="stop-color:#ef4444;stop-opacity:0.4" />
          <stop offset="100%" style="stop-color:#ef4444;stop-opacity:0.3" />
        </linearGradient>
        <clipPath id="areaClip">
          <polygon points="${svgPoints}" />
        </clipPath>
      </defs>
      <g clip-path="url(#areaClip)">
        <rect x="0" y="0" width="${size}" height="${size}" fill="url(#commGradient)" />
        <ellipse cx="${size * 0.25}" cy="${size * 0.6}" rx="${size * 0.12}" ry="${size * 0.08}" fill="#ef4444" opacity="0.6" />
        <ellipse cx="${size * 0.7}" cy="${size * 0.25}" rx="${size * 0.1}" ry="${size * 0.15}" fill="#ef4444" opacity="0.5" />
        <circle cx="${size * 0.5}" cy="${size * 0.75}" r="${size * 0.06}" fill="#ef4444" opacity="0.7" />
        <ellipse cx="${size * 0.8}" cy="${size * 0.7}" rx="${size * 0.08}" ry="${size * 0.1}" fill="#ef4444" opacity="0.5" />
      </g>
      <polygon points="${svgPoints}" fill="none" stroke="#a855f7" stroke-width="2" />
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
      const imageData = generateMockCalculationImage(input.drone.area);

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
      operationalArea: z.array(coordinateSchema),
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
        operational_area: input.operationalArea,
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
