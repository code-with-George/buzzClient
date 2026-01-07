import { X, Navigation, Hand, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCoordinates } from '@/lib/utils';
import type { Coordinates } from '@/store/AppContext';

interface LocationPickerProps {
  title: string;
  subtitle: string;
  currentLocation: Coordinates | null;
  onSelect: (method: 'current' | 'map') => void;
  onClose: () => void;
}

export function LocationPicker({
  title,
  subtitle,
  currentLocation,
  onSelect,
  onClose,
}: LocationPickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-buzz-dark-card rounded-t-3xl border-t border-buzz-dark-border p-5 pb-8 safe-area-bottom animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold tracking-tight">{title}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-buzz-dark-border rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {/* Pin current location */}
          <button
            onClick={() => onSelect('current')}
            disabled={!currentLocation}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-buzz-purple text-white hover:bg-buzz-purple-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="p-3 bg-white/20 rounded-xl">
              <Navigation className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-semibold">Pin Current Location</h4>
              <p className="text-sm text-white/70">
                {currentLocation
                  ? formatCoordinates(currentLocation.lat, currentLocation.lng)
                  : 'Location unavailable'}
              </p>
            </div>
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Tap on map */}
          <button
            onClick={() => onSelect('map')}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-buzz-dark border border-buzz-dark-border hover:border-buzz-purple transition-all"
          >
            <div className="p-3 bg-buzz-dark-border rounded-xl">
              <Hand className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="font-semibold">Tap on Map</h4>
              <p className="text-sm text-muted-foreground">
                Manually select a point
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Cancel */}
        <button
          onClick={onClose}
          className="w-full mt-6 text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

