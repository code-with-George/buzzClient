import React from 'react';
import { Bot, Plane, Camera, Radio, Truck, Radar } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { trpc } from '@/lib/trpc';
import { cn, getBatteryColor } from '@/lib/utils';

// Icon map for drone types
const droneIcons: Record<string, React.ReactNode> = {
  patrol: <Bot className="h-5 w-5" />,
  survey: <Plane className="h-5 w-5" />,
  camera: <Camera className="h-5 w-5" />,
  recon: <Radar className="h-5 w-5" />,
  cargo: <Truck className="h-5 w-5" />,
  relay: <Radio className="h-5 w-5" />,
  default: <Bot className="h-5 w-5" />,
};

export function PinnedDronesList() {
  const { dispatch } = useApp();
  const pinnedDrones = trpc.drones.getPinned.useQuery();
  const addToRecent = trpc.drones.addToRecentlyUsed.useMutation();

  const handleSelectDrone = (drone: {
    drone_id: number;
    drone_name: string;
    type: string;
    battery_level: number;
    controller_altitude: number | null;
    controller_lat: number | null;
    controller_lng: number | null;
    drone_altitude: number | null;
    drone_lat: number | null;
    drone_lng: number | null;
    drone_radius: number | null;
  }) => {
    // Add to recently used
    addToRecent.mutate({ droneId: drone.drone_id, droneName: drone.drone_name });

    // Check if this drone has saved configuration
    const hasConfig = drone.controller_altitude !== null || drone.drone_altitude !== null;

    if (hasConfig) {
      // Select drone with saved configuration
      dispatch({
        type: 'SELECT_DRONE_WITH_CONFIG',
        payload: {
          drone: {
            id: drone.drone_id,
            name: drone.drone_name,
            type: drone.type,
            batteryLevel: drone.battery_level,
          },
          controllerConfig: {
            altitude: drone.controller_altitude || 0,
            location: drone.controller_lat !== null && drone.controller_lng !== null
              ? { lat: drone.controller_lat, lng: drone.controller_lng }
              : null,
          },
          droneConfig: {
            altitude: drone.drone_altitude || 0,
            location: drone.drone_lat !== null && drone.drone_lng !== null
              ? { lat: drone.drone_lat, lng: drone.drone_lng }
              : null,
            radius: drone.drone_radius || 500,
          },
        },
      });
    } else {
      // Select drone without config (open empty config form)
      dispatch({
        type: 'SELECT_DRONE',
        payload: {
          id: drone.drone_id,
          name: drone.drone_name,
          type: drone.type,
          batteryLevel: drone.battery_level,
        },
      });
    }
  };

  if (!pinnedDrones.data || pinnedDrones.data.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Pinned Units
        </span>
        <button className="text-xs text-buzz-purple hover:text-buzz-purple-light transition-colors">
          Edit
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
        {pinnedDrones.data.map((drone) => {
          const batteryColor = getBatteryColor(drone.battery_level);
          const isLowBattery = drone.battery_level < 20;
          const isAvailable = drone.status === 'available';

          return (
            <button
              key={drone.id}
              onClick={() => handleSelectDrone(drone)}
              className={cn(
                'flex-shrink-0 w-40 p-4 rounded-xl border transition-all tap-target',
                'bg-buzz-dark border-buzz-dark-border hover:border-buzz-purple',
                'focus:outline-none focus:ring-2 focus:ring-buzz-purple focus:ring-offset-2 focus:ring-offset-buzz-dark-card'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-buzz-purple/20 rounded-lg text-buzz-purple">
                  {droneIcons[drone.type] || droneIcons.default}
                </div>
                <span
                  className={cn(
                    'h-2.5 w-2.5 rounded-full',
                    isAvailable ? 'bg-buzz-green status-online' : 'bg-buzz-orange'
                  )}
                />
              </div>

              {/* Name */}
              <h3 className="font-bold text-left mb-1">{drone.drone_name}</h3>

              {/* Status info */}
              <p className="text-xs text-muted-foreground text-left mb-3 truncate">
                {drone.type.charAt(0).toUpperCase() + drone.type.slice(1)}
                {isLowBattery && ' • Low Bat'}
              </p>

              {/* Battery bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-buzz-dark-border rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      drone.battery_level > 50
                        ? 'bg-buzz-green'
                        : drone.battery_level > 20
                        ? 'bg-buzz-orange'
                        : 'bg-buzz-red'
                    )}
                    style={{ width: `${drone.battery_level}%` }}
                  />
                </div>
                <span className={cn('text-xs font-mono', batteryColor)}>
                  {drone.battery_level}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

