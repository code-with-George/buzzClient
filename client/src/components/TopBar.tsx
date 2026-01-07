import React from 'react';
import { Menu, Wifi } from 'lucide-react';
import { useApp } from '@/store/AppContext';

export function TopBar() {
  const { state } = useApp();

  // Mock telemetry data
  const telemetry = {
    altitude: state.droneConfig.altitude || 120,
    speed: 14,
    battery: state.selectedDrone?.batteryLevel || 84,
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-10 safe-area-top">
      <div className="glass rounded-2xl px-4 py-3 flex items-center justify-between">
        {/* Menu button */}
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors tap-target">
          <Menu className="h-5 w-5" />
        </button>

        {/* Telemetry */}
        <div className="flex items-center gap-6">
          {/* Altitude */}
          <div className="text-center">
            <span className="text-xs text-muted-foreground block">ALT</span>
            <div className="flex items-center gap-1">
              <span className="text-buzz-purple">↑</span>
              <span className="font-semibold">{telemetry.altitude}</span>
              <span className="text-xs text-muted-foreground">m</span>
            </div>
          </div>

          {/* Speed */}
          <div className="text-center">
            <span className="text-xs text-muted-foreground block">SPD</span>
            <div className="flex items-center gap-1">
              <span className="text-buzz-purple">◉</span>
              <span className="font-semibold">{telemetry.speed}</span>
              <span className="text-xs text-muted-foreground">m/s</span>
            </div>
          </div>

          {/* Battery */}
          <div className="text-center">
            <span className="text-xs text-muted-foreground block">BAT</span>
            <div className="flex items-center gap-1">
              <span className={telemetry.battery > 50 ? 'text-buzz-green' : telemetry.battery > 20 ? 'text-buzz-orange' : 'text-buzz-red'}>
                ▮
              </span>
              <span className="font-semibold">{telemetry.battery}</span>
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
        </div>

        {/* Signal indicator */}
        <div className="p-2 bg-buzz-dark-card rounded-lg">
          <Wifi className="h-5 w-5 text-buzz-green" />
        </div>
      </div>
    </div>
  );
}

