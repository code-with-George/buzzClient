import { router } from '../trpc.js';
import { authRouter } from './auth.js';
import { dronesRouter } from './drones.js';
import { flightRouter } from './flight.js';

export const appRouter = router({
  auth: authRouter,
  drones: dronesRouter,
  flight: flightRouter,
});

export type AppRouter = typeof appRouter;

