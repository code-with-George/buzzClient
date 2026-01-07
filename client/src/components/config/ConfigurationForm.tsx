import React, { useState } from 'react';
import { X, MapPin, Loader2, Rocket, Bookmark } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ControllerIcon, DroneIcon } from '@/components/icons/BuzzIcon';
import { LocationPicker } from './LocationPicker';
import { trpc } from '@/lib/trpc';
import { cn, formatCoordinates } from '@/lib/utils';

type Unit = 'M' | 'FT';

export function ConfigurationForm() {
  const { state, dispatch } = useApp();
  const utils = trpc.useUtils();
  
  // Form state - initialize from state (for pre-filled pinned drones)
  const [controllerAltitude, setControllerAltitude] = useState(state.controllerConfig.altitude || 1.5);
  const [droneAltitude, setDroneAltitude] = useState(state.droneConfig.altitude || 120);
  const [droneRadius, setDroneRadius] = useState(state.droneConfig.radius || 500);
  const [altitudeUnit, setAltitudeUnit] = useState<Unit>('M');
  
  // Location picker state
  const [showControllerPicker, setShowControllerPicker] = useState(false);
  const [showDronePicker, setShowDronePicker] = useState(false);
  
  // Mutations
  const calculateMutation = trpc.flight.calculate.useMutation();
  const pinDrone = trpc.drones.pin.useMutation({
    onSuccess: () => {
      utils.drones.getPinned.invalidate();
    },
  });

  const controllerLocationSet = !!state.controllerConfig.location;
  const droneLocationSet = !!state.droneConfig.location;
  
  const canSubmit = 
    controllerAltitude > 0 &&
    controllerLocationSet &&
    droneAltitude > 0 &&
    droneRadius > 0;

  const handleClose = () => {
    dispatch({ type: 'RESET_DEPLOYMENT' });
  };

  const handleControllerAltitudeChange = (value: number) => {
    setControllerAltitude(value);
    dispatch({ type: 'SET_CONTROLLER_ALTITUDE', payload: value });
  };

  const handleDroneAltitudeChange = (value: number) => {
    setDroneAltitude(value);
    dispatch({ type: 'SET_DRONE_ALTITUDE', payload: value });
  };

  const handleRadiusChange = (value: number[]) => {
    setDroneRadius(value[0]);
    dispatch({ type: 'SET_DRONE_RADIUS', payload: value[0] });
  };

  // Save current configuration as template
  const handleSaveConfiguration = () => {
    if (!state.selectedDrone) return;
    
    pinDrone.mutate({
      droneId: state.selectedDrone.id,
      droneName: state.selectedDrone.name,
      config: {
        controllerAltitude,
        controllerLat: state.controllerConfig.location?.lat,
        controllerLng: state.controllerConfig.location?.lng,
        droneAltitude,
        droneLat: state.droneConfig.location?.lat,
        droneLng: state.droneConfig.location?.lng,
        droneRadius,
      },
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit || !state.selectedDrone) return;
    
    // Close form and show calculating
    dispatch({ type: 'SET_CONFIG_FORM_OPEN', payload: false });
    dispatch({ type: 'SET_PHASE', payload: 'calculating' });

    try {
      const result = await calculateMutation.mutateAsync({
        droneId: state.selectedDrone.id,
        droneName: state.selectedDrone.name,
        controller: {
          altitude: controllerAltitude,
          lat: state.controllerConfig.location!.lat,
          lng: state.controllerConfig.location!.lng,
        },
        drone: {
          altitude: droneAltitude,
          lat: state.droneConfig.location!.lat,
          lng: state.droneConfig.location!.lng,
          radius: droneRadius,
        },
      });

      dispatch({
        type: 'SET_CALCULATION_RESULT',
        payload: {
          imageData: result.imageData,
          calculatedAt: result.calculatedAt,
        },
      });
    } catch (error) {
      console.error('Calculation failed:', error);
      dispatch({ type: 'SET_PHASE', payload: 'configuring' });
      dispatch({ type: 'SET_CONFIG_FORM_OPEN', payload: true });
    }
  };

  // Handle location picker selection
  const handleControllerLocationSelect = (method: 'current' | 'map') => {
    setShowControllerPicker(false);
    
    if (method === 'current' && state.userLocation) {
      dispatch({ type: 'SET_CONTROLLER_LOCATION', payload: state.userLocation });
    } else if (method === 'map') {
      dispatch({ type: 'SET_PLACEMENT_MODE', payload: 'controller' });
    }
  };

  const handleDroneLocationSelect = (method: 'current' | 'map') => {
    setShowDronePicker(false);
    
    if (method === 'current' && state.userLocation) {
      dispatch({ type: 'SET_DRONE_LOCATION', payload: state.userLocation });
    } else if (method === 'map') {
      dispatch({ type: 'SET_PLACEMENT_MODE', payload: 'drone' });
    }
  };

  return (
    <>
      <div className="absolute inset-x-0 bottom-0 z-30 bg-buzz-dark-card rounded-t-3xl border-t border-buzz-dark-border shadow-2xl safe-area-bottom animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1.5 bg-buzz-dark-border rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">CONFIGURATION</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-2 w-2 rounded-full bg-buzz-green" />
              <span className="text-sm text-muted-foreground">
                Drone ID: {state.selectedDrone?.name} · Connected
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-buzz-dark-border rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form content */}
        <div className="px-5 pb-6 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {/* Section 1: Remote Controller */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-buzz-purple">
              <ControllerIcon size={20} />
              <span className="text-sm font-bold tracking-wider uppercase">Remote Controller</span>
            </div>

            {/* Controller Altitude */}
            <div className="space-y-2">
              <Label>ALTITUDE</Label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={controllerAltitude}
                    onChange={(e) => handleControllerAltitudeChange(parseFloat(e.target.value) || 0)}
                    className="pr-10 font-mono"
                    min={0}
                    step={0.1}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    M
                  </span>
                </div>
                
                {/* Pin location button */}
                <Button
                  variant={controllerLocationSet ? 'success' : 'secondary'}
                  size="icon"
                  className="h-12 w-12"
                  onClick={() => setShowControllerPicker(true)}
                >
                  <MapPin className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Location status */}
              {controllerLocationSet && (
                <p className="text-xs text-buzz-green">
                  ✓ Location set: {formatCoordinates(state.controllerConfig.location!.lat, state.controllerConfig.location!.lng)}
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-buzz-dark-border" />

          {/* Section 2: Drone */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-buzz-purple">
              <DroneIcon size={20} />
              <span className="text-sm font-bold tracking-wider uppercase">Drone</span>
            </div>

            {/* Drone Altitude */}
            <div className="space-y-2">
              <Label>MAX ALTITUDE</Label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={droneAltitude}
                    onChange={(e) => handleDroneAltitudeChange(parseFloat(e.target.value) || 0)}
                    className="font-mono"
                    min={0}
                  />
                </div>
                
                <ToggleGroup
                  type="single"
                  value={altitudeUnit}
                  onValueChange={(value) => value && setAltitudeUnit(value as Unit)}
                >
                  <ToggleGroupItem value="M">M</ToggleGroupItem>
                  <ToggleGroupItem value="FT">FT</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            {/* Radius */}
            <div className="space-y-2">
              <Label>RADIUS</Label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={droneRadius}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setDroneRadius(val);
                      dispatch({ type: 'SET_DRONE_RADIUS', payload: val });
                    }}
                    className="pr-10 font-mono"
                    min={50}
                    max={5000}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    M
                  </span>
                </div>
                
                {/* Pin location button */}
                <Button
                  variant={droneLocationSet ? 'success' : 'secondary'}
                  size="icon"
                  className="h-12 w-12"
                  onClick={() => setShowDronePicker(true)}
                  disabled={!controllerLocationSet}
                >
                  <MapPin className="h-5 w-5" />
                </Button>
              </div>

              {/* Radius slider */}
              <div className="pt-2">
                <Slider
                  value={[droneRadius]}
                  onValueChange={handleRadiusChange}
                  min={50}
                  max={5000}
                  step={50}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">50m</span>
                  <span className="text-xs text-muted-foreground">5km</span>
                </div>
              </div>

              {/* Location status */}
              {droneLocationSet && (
                <p className="text-xs text-buzz-green">
                  ✓ Location set: {formatCoordinates(state.droneConfig.location!.lat, state.droneConfig.location!.lng)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-6 space-y-3">
          <Button
            onClick={handleSubmit}
            size="xl"
            className="w-full"
            disabled={!canSubmit || calculateMutation.isPending}
          >
            {calculateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-5 w-5" />
                ENGAGE SYSTEMS
              </>
            )}
          </Button>

          {/* Save Configuration as Template */}
          <button
            onClick={handleSaveConfiguration}
            disabled={!state.selectedDrone || pinDrone.isPending}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-buzz-purple transition-colors py-2 disabled:opacity-50"
          >
            <Bookmark className={cn("h-4 w-4", pinDrone.isSuccess && "fill-buzz-purple text-buzz-purple")} />
            {pinDrone.isPending ? 'Saving...' : pinDrone.isSuccess ? 'Configuration Saved!' : 'Save Configuration as Template'}
          </button>

          <button
            onClick={handleClose}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Cancel Configuration
          </button>
        </div>
      </div>

      {/* Location picker modals */}
      {showControllerPicker && (
        <LocationPicker
          title="CONTROLLER LOCATION"
          subtitle="SET RETURN HOME COORDINATES"
          currentLocation={state.userLocation}
          onSelect={handleControllerLocationSelect}
          onClose={() => setShowControllerPicker(false)}
        />
      )}

      {showDronePicker && (
        <LocationPicker
          title="DRONE LOCATION"
          subtitle="SET OPERATIONAL CENTER"
          currentLocation={state.userLocation}
          onSelect={handleDroneLocationSelect}
          onClose={() => setShowDronePicker(false)}
        />
      )}
    </>
  );
}

