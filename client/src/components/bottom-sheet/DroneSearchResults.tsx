import React from 'react';
import { Bot, Loader2, SearchX, ChevronLeft, Bookmark } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { trpc } from '@/lib/trpc';
import { cn, getBatteryColor } from '@/lib/utils';

// Drone type translations
const droneTypeHebrew: Record<string, string> = {
  patrol: 'סיור',
  survey: 'מיפוי',
  camera: 'צילום',
  recon: 'סיור',
  cargo: 'מטען',
  relay: 'תקשורת',
  surveillance: 'מעקב',
  scout: 'סיור',
  stealth: 'התגנבות',
  general: 'כללי',
};

interface DroneSearchResultsProps {
  results: Array<{
    id: number;
    name: string;
    type: string;
    status: string;
    battery_level: number;
  }>;
  isLoading: boolean;
  query: string;
}

export function DroneSearchResults({ results, isLoading, query }: DroneSearchResultsProps) {
  const { dispatch } = useApp();
  const utils = trpc.useUtils();
  const addToRecent = trpc.drones.addToRecentlyUsed.useMutation();
  const pinnedDrones = trpc.drones.getPinned.useQuery();
  const pinDrone = trpc.drones.pin.useMutation({
    onSuccess: () => {
      utils.drones.getPinned.invalidate();
    },
  });
  const unpinDrone = trpc.drones.unpin.useMutation({
    onSuccess: () => {
      utils.drones.getPinned.invalidate();
    },
  });

  const isDronePinned = (droneId: number) => {
    return pinnedDrones.data?.some(p => p.drone_id === droneId) || false;
  };

  const handleTogglePin = (e: React.MouseEvent, droneId: number, droneName: string) => {
    e.stopPropagation();
    if (isDronePinned(droneId)) {
      unpinDrone.mutate({ droneId });
    } else {
      pinDrone.mutate({ droneId, droneName });
    }
  };

  const handleSelectDrone = (drone: {
    id: number;
    name: string;
    type: string;
    battery_level: number;
  }) => {
    // Add to recently used
    addToRecent.mutate({ droneId: drone.id, droneName: drone.name });

    // Select the drone
    dispatch({
      type: 'SELECT_DRONE',
      payload: {
        id: drone.id,
        name: drone.name,
        type: drone.type,
        batteryLevel: drone.battery_level,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-buzz-purple animate-spin mb-3" />
        <p className="text-sm text-muted-foreground">
          {query ? 'מחפש בצי הרחפנים...' : 'טוען רחפנים...'}
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <SearchX className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground mb-1">לא נמצאו רחפנים</p>
        <p className="text-xs text-muted-foreground">
          {query ? 'נסה לחפש בשם או מזהה אחר' : 'אין רחפנים זמינים'}
        </p>
      </div>
    );
  }

  const isShowingAll = !query;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isShowingAll ? 'רחפנים זמינים' : 'תוצאות חיפוש'}
        </span>
        <span className="text-xs text-muted-foreground">
          {results.length} {isShowingAll ? 'רחפנים' : 'נמצאו'}
        </span>
      </div>

      <div className="space-y-2">
        {results.map((drone) => {
          const typeHebrew = droneTypeHebrew[drone.type] || drone.type;
          
          return (
            <button
              key={drone.id}
              onClick={() => handleSelectDrone(drone)}
              className={cn(
                'w-full flex flex-row-reverse items-center gap-3 p-3 rounded-xl transition-all tap-target',
                'bg-buzz-dark border border-transparent hover:border-buzz-purple',
                'focus:outline-none focus:ring-2 focus:ring-buzz-purple focus:ring-offset-2 focus:ring-offset-buzz-dark-card'
              )}
            >
              {/* Icon */}
              <div className="p-2.5 bg-buzz-purple/20 rounded-xl text-buzz-purple">
                <Bot className="h-5 w-5" />
              </div>

              {/* Info */}
              <div className="flex-1 text-right">
                <h3 className="font-semibold">
                  {/* Highlight matching text */}
                  {highlightMatch(drone.name, query)}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {typeHebrew} •{' '}
                  <span className={cn(
                    drone.status === 'available' ? 'text-buzz-green' :
                    drone.status === 'in_use' ? 'text-buzz-orange' :
                    'text-buzz-red'
                  )}>
                    {drone.status === 'available' ? 'זמין' :
                     drone.status === 'in_use' ? 'בשימוש' : 'לא מקוון'}
                  </span>
                </p>
              </div>

              {/* Battery */}
              <div className="flex items-center gap-2">
                <div className="w-12 h-1.5 bg-buzz-dark-border rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      drone.battery_level > 50
                        ? 'bg-buzz-green'
                        : drone.battery_level > 20
                        ? 'bg-buzz-orange'
                        : 'bg-buzz-red'
                    )}
                    style={{ width: `${drone.battery_level}%` }}
                  />
                </div>
                <span className={cn('text-xs font-mono', getBatteryColor(drone.battery_level))}>
                  {drone.battery_level}%
                </span>
              </div>

              {/* Pin/Unpin Toggle button */}
              <button
                onClick={(e) => handleTogglePin(e, drone.id, drone.name)}
                className={cn(
                  'p-2 rounded-lg transition-all hover:bg-buzz-dark-border',
                  isDronePinned(drone.id) 
                    ? 'text-buzz-purple' 
                    : 'text-muted-foreground hover:text-buzz-purple'
                )}
                title={isDronePinned(drone.id) ? 'הסר מתבניות' : 'שמור כתבנית'}
              >
                <Bookmark 
                  className={cn(
                    'h-4 w-4',
                    isDronePinned(drone.id) && 'fill-buzz-purple'
                  )} 
                />
              </button>

              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Helper to highlight matching text
function highlightMatch(text: string, query: string) {
  if (!query) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="text-buzz-purple font-bold">
        {part}
      </span>
    ) : (
      part
    )
  );
}
