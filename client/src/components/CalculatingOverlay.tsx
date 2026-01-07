import React from 'react';
import { Loader2 } from 'lucide-react';
import { DroneIcon } from '@/components/icons/BuzzIcon';

export function CalculatingOverlay() {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center">
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Loader content */}
      <div className="relative flex flex-col items-center">
        {/* Animated drone icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-buzz-purple rounded-full blur-xl opacity-50 animate-pulse" />
          <div className="relative p-6 bg-buzz-dark-card rounded-2xl border border-buzz-dark-border">
            <DroneIcon size={48} className="text-buzz-purple" />
          </div>
        </div>

        {/* Loading spinner and text */}
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-buzz-purple animate-spin" />
          <span className="text-lg font-semibold tracking-wider uppercase">
            Calculating
          </span>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-buzz-purple"
              style={{
                animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground mt-4 text-center max-w-xs">
          Analyzing communication zones and signal strength...
        </p>
      </div>
    </div>
  );
}

