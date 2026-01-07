import { CheckCircle, Loader2 } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

export function ResultActions() {
  const { state, dispatch } = useApp();
  const utils = trpc.useUtils();
  
  const saveToHistory = trpc.flight.saveToHistory.useMutation({
    onSuccess: () => {
      // Invalidate flight history to refresh the list immediately
      utils.flight.getHistory.invalidate();
    },
  });

  // Handle end - save to history and go back to main screen
  const handleEnd = async () => {
    if (!state.selectedDrone || !state.controllerConfig.location || !state.droneConfig.location || !state.droneConfig.drawnArea) {
      dispatch({ type: 'RESET_DEPLOYMENT' });
      return;
    }

    // Save to history with "Launched" status
    await saveToHistory.mutateAsync({
      droneId: state.selectedDrone.id,
      droneName: state.selectedDrone.name,
      droneType: state.selectedDrone.type,
      controllerAltitude: state.controllerConfig.altitude,
      controllerLat: state.controllerConfig.location.lat,
      controllerLng: state.controllerConfig.location.lng,
      droneAltitude: state.droneConfig.altitude,
      droneLat: state.droneConfig.location.lat,
      droneLng: state.droneConfig.location.lng,
      operationalArea: state.droneConfig.drawnArea,
      status: 'Launched',
      controlCenterApproved: null,
    });

    // Reset and return to main screen
    dispatch({ type: 'RESET_DEPLOYMENT' });
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 safe-area-bottom">
      <div className="mx-4 mb-4">
        <Button
          size="xl"
          onClick={handleEnd}
          className="w-full"
          disabled={saveToHistory.isPending}
        >
          {saveToHistory.isPending ? (
            <>
              <Loader2 className="ms-2 h-5 w-5 animate-spin" />
              שומר...
            </>
          ) : (
            <>
              <CheckCircle className="ms-2 h-5 w-5" />
              סיום
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
