import React from 'react';
import { Bot, Plane, Camera, Radio, Truck, Radar, ChevronRight, History } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

// Icon map for drone types
const droneIcons: Record<string, React.ReactNode> = {
  patrol: <Bot className="h-5 w-5" />,
  survey: <Plane className="h-5 w-5" />,
  camera: <Camera className="h-5 w-5" />,
  recon: <Radar className="h-5 w-5" />,
  cargo: <Truck className="h-5 w-5" />,
  relay: <Radio className="h-5 w-5" />,
  surveillance: <Radar className="h-5 w-5" />,
  scout: <Plane className="h-5 w-5" />,
  stealth: <Bot className="h-5 w-5" />,
  general: <Bot className="h-5 w-5" />,
  default: <Bot className="h-5 w-5" />,
};

export function HistoryDronesList() {
  const { dispatch } = useApp();
  const flightHistory = trpc.flight.getHistory.useQuery();

  const handleSelectFromHistory = (flight: {
    drone_id: number;
    drone_name: string;
    drone_type: string;
    controller_altitude: number;
    controller_lat: number;
    controller_lng: number;
    drone_altitude: number;
    drone_lat: number;
    drone_lng: number;
    operational_radius: number;
  }) => {
    // Select drone with all saved configuration
    dispatch({
      type: 'SELECT_DRONE_WITH_CONFIG',
      payload: {
        drone: {
          id: flight.drone_id,
          name: flight.drone_name,
          type: flight.drone_type,
          batteryLevel: 100, // Default, will be updated from actual drone data
        },
        controllerConfig: {
          altitude: flight.controller_altitude,
          location: {
            lat: flight.controller_lat,
            lng: flight.controller_lng,
          },
        },
        droneConfig: {
          altitude: flight.drone_altitude,
          location: {
            lat: flight.drone_lat,
            lng: flight.drone_lng,
          },
          radius: flight.operational_radius,
        },
      },
    });
  };

  if (!flightHistory.data || flightHistory.data.length === 0) {
    return null;
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Launch History
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {flightHistory.data.length} flights
        </span>
      </div>

      <div className="space-y-2">
        {flightHistory.data.map((flight) => (
          <button
            key={flight.id}
            onClick={() => handleSelectFromHistory(flight)}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl transition-all tap-target',
              'bg-buzz-dark border border-transparent hover:border-buzz-purple',
              'focus:outline-none focus:ring-2 focus:ring-buzz-purple focus:ring-offset-2 focus:ring-offset-buzz-dark-card'
            )}
          >
            {/* Icon */}
            <div className="p-2.5 bg-buzz-purple/20 rounded-xl text-buzz-purple">
              {droneIcons[flight.drone_type] || droneIcons.default}
            </div>

            {/* Info */}
            <div className="flex-1 text-left">
              <h3 className="font-semibold">{flight.drone_name}</h3>
              <p className="text-xs text-muted-foreground">
                {flight.drone_type.charAt(0).toUpperCase() + flight.drone_type.slice(1)} • 
                Alt: {flight.drone_altitude}m • R: {flight.operational_radius}m
              </p>
            </div>

            {/* Time */}
            <div className="text-right">
              <p className="text-xs text-buzz-green font-semibold">LAUNCHED</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(flight.created_at)}
              </p>
            </div>

            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}

