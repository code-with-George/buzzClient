import { useState } from 'react';
import { X, MapPin, Loader2, Rocket, PenTool, Trash2 } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ControllerIcon, DroneIcon } from '@/components/icons/BuzzIcon';
import { LocationPicker } from './LocationPicker';
import { trpc } from '@/lib/trpc';
import { cn, formatCoordinates } from '@/lib/utils';

type Unit = 'M' | 'FT';

export function ConfigurationForm() {
  const { state, dispatch } = useApp();
  
  // Form state - initialize from state (for pre-filled pinned drones)
  const [controllerAltitude, setControllerAltitude] = useState(state.controllerConfig.altitude || 1.5);
  const [droneAltitude, setDroneAltitude] = useState(state.droneConfig.altitude || 120);
  const [altitudeUnit, setAltitudeUnit] = useState<Unit>('M');
  
  // Location picker state
  const [showControllerPicker, setShowControllerPicker] = useState(false);
  
  // Mutations
  const calculateMutation = trpc.flight.calculate.useMutation();

  const controllerLocationSet = !!state.controllerConfig.location;
  const droneAreaSet = !!state.droneConfig.drawnArea && state.droneConfig.drawnArea.length > 2;
  // Drone location is automatically set when area is drawn (centroid)
  const droneLocationSet = !!state.droneConfig.location;
  
  const canSubmit = 
    controllerAltitude > 0 &&
    controllerLocationSet &&
    droneAltitude > 0 &&
    droneAreaSet;

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

  // Start drawing mode
  const handleStartDrawing = () => {
    dispatch({ type: 'CLEAR_DRONE_AREA' });
    dispatch({ type: 'SET_PLACEMENT_MODE', payload: 'drawing' });
  };

  // Clear drawn area
  const handleClearArea = () => {
    dispatch({ type: 'CLEAR_DRONE_AREA' });
  };

  const handleSubmit = async () => {
    if (!canSubmit || !state.selectedDrone || !state.droneConfig.drawnArea || !state.droneConfig.location) return;
    
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
          lat: state.droneConfig.location.lat,
          lng: state.droneConfig.location.lng,
          area: state.droneConfig.drawnArea,
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

  // Check if we're in placement mode (user is selecting location or drawing on map)
  const isInPlacementMode = state.placementMode !== 'none';

  return (
    <>
      <div 
        className={cn(
          "absolute inset-x-0 bottom-0 z-30 bg-buzz-dark-card rounded-t-3xl border-t border-buzz-dark-border shadow-2xl safe-area-bottom",
          "transition-transform duration-300 ease-out",
          isInPlacementMode ? "translate-y-full" : "translate-y-0"
        )}
      >
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1.5 bg-buzz-dark-border rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">הגדרות</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-2 w-2 rounded-full bg-buzz-green" />
              <span className="text-sm text-muted-foreground">
                מזהה רחפן: {state.selectedDrone?.name} · מחובר
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
              <span className="text-sm font-bold tracking-wider uppercase">שלט רחוק</span>
            </div>

            {/* Controller Altitude */}
            <div className="space-y-2">
              <Label>גובה</Label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={controllerAltitude}
                    onChange={(e) => handleControllerAltitudeChange(parseFloat(e.target.value) || 0)}
                    className="pe-10 font-mono"
                    min={0}
                    step={0.1}
                    dir="ltr"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    מ׳
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
                  ✓ מיקום נקבע: {formatCoordinates(state.controllerConfig.location!.lat, state.controllerConfig.location!.lng)}
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
              <span className="text-sm font-bold tracking-wider uppercase">רחפן</span>
            </div>

            {/* Drone Altitude */}
            <div className="space-y-2">
              <Label>גובה מקסימלי</Label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={droneAltitude}
                    onChange={(e) => handleDroneAltitudeChange(parseFloat(e.target.value) || 0)}
                    className="font-mono"
                    min={0}
                    dir="ltr"
                  />
                </div>
                
                <ToggleGroup
                  type="single"
                  value={altitudeUnit}
                  onValueChange={(value) => value && setAltitudeUnit(value as Unit)}
                >
                  <ToggleGroupItem value="M">מ׳</ToggleGroupItem>
                  <ToggleGroupItem value="FT">רגל</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            {/* Draw Operational Area */}
            <div className="space-y-2">
              <Label>אזור פעולה</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant={droneAreaSet ? 'success' : 'secondary'}
                  className="flex-1 h-12"
                  onClick={handleStartDrawing}
                  disabled={!controllerLocationSet}
                >
                  <PenTool className="h-5 w-5 ms-2" />
                  {droneAreaSet ? 'שרטט מחדש' : 'שרטט אזור על המפה'}
                </Button>
                
                {droneAreaSet && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-12 w-12"
                    onClick={handleClearArea}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                )}
              </div>
              
              {/* Area status */}
              {droneAreaSet && droneLocationSet && (
                <p className="text-xs text-buzz-green">
                  ✓ אזור הוגדר עם {state.droneConfig.drawnArea!.length} נקודות
                  <br />
                  ✓ רחפן ממוקם במרכז: {formatCoordinates(state.droneConfig.location!.lat, state.droneConfig.location!.lng)}
                </p>
              )}
              {!droneAreaSet && controllerLocationSet && (
                <p className="text-xs text-muted-foreground">
                  שרטט מצולע על המפה כדי להגדיר את אזור הפעולה
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
                <Loader2 className="ms-2 h-5 w-5 animate-spin" />
                מחשב...
              </>
            ) : (
              <>
                <Rocket className="ms-2 h-5 w-5" />
                הפעל מערכות
              </>
            )}
          </Button>

          <button
            onClick={handleClose}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            ביטול הגדרות
          </button>
        </div>
      </div>

      {/* Location picker modal */}
      {showControllerPicker && (
        <LocationPicker
          title="מיקום השלט"
          subtitle="קבע קואורדינטות לחזרה הביתה"
          currentLocation={state.userLocation}
          onSelect={handleControllerLocationSelect}
          onClose={() => setShowControllerPicker(false)}
        />
      )}
    </>
  );
}
