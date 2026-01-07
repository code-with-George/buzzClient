import { useState } from 'react';
import { X, Rocket, Loader2, Check, XCircle, Shield } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { DroneIcon } from '@/components/icons/BuzzIcon';
import { cn } from '@/lib/utils';

export function ResultActions() {
  const { state, dispatch } = useApp();
  const [, setIsRequestingApproval] = useState(false);
  
  const saveToHistory = trpc.flight.saveToHistory.useMutation();
  const requestApproval = trpc.flight.requestApproval.useMutation();

  // Handle cancel
  const handleCancel = async () => {
    if (!state.selectedDrone || !state.controllerConfig.location || !state.droneConfig.location || !state.droneConfig.drawnArea) {
      dispatch({ type: 'RESET_DEPLOYMENT' });
      return;
    }

    // Save to history with "Not Launched" status
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
      status: 'Not Launched',
      controlCenterApproved: state.controlCenterStatus === 'approved' ? true : 
                             state.controlCenterStatus === 'not_approved' ? false : null,
    });

    dispatch({ type: 'RESET_DEPLOYMENT' });
  };

  // Handle send to control center
  const handleSendToControlCenter = async () => {
    if (!state.selectedDrone) return;

    dispatch({ type: 'SET_CONTROL_CENTER_STATUS', payload: 'sending' });
    setIsRequestingApproval(true);

    try {
      const result = await requestApproval.mutateAsync({
        droneId: state.selectedDrone.id,
        droneName: state.selectedDrone.name,
      });

      dispatch({
        type: 'SET_CONTROL_CENTER_STATUS',
        payload: result.approved ? 'approved' : 'not_approved',
      });
    } catch (error) {
      console.error('Approval request failed:', error);
      dispatch({ type: 'SET_CONTROL_CENTER_STATUS', payload: 'not_approved' });
    } finally {
      setIsRequestingApproval(false);
    }
  };

  // Handle launch
  const handleLaunch = async () => {
    if (!state.selectedDrone || !state.controllerConfig.location || !state.droneConfig.location || !state.droneConfig.drawnArea) {
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
      controlCenterApproved: state.controlCenterStatus === 'approved' ? true : 
                             state.controlCenterStatus === 'not_approved' ? false : null,
    });

    // Reset and return to main screen
    dispatch({ type: 'RESET_DEPLOYMENT' });
  };

  // Render control center button content
  const renderControlCenterButton = () => {
    switch (state.controlCenterStatus) {
      case 'sending':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        );
      case 'approved':
        return (
          <>
            <Check className="mr-2 h-4 w-4" />
            Approved
          </>
        );
      case 'not_approved':
        return (
          <>
            <XCircle className="mr-2 h-4 w-4" />
            Not Approved
          </>
        );
      default:
        return (
          <>
            <Shield className="mr-2 h-4 w-4" />
            Send to HQ
          </>
        );
    }
  };

  const getControlCenterButtonStyle = () => {
    switch (state.controlCenterStatus) {
      case 'approved':
        return 'bg-buzz-green/20 text-buzz-green border-buzz-green/30';
      case 'not_approved':
        return 'bg-buzz-red/20 text-buzz-red border-buzz-red/30';
      case 'sending':
        return 'bg-buzz-dark-card text-muted-foreground';
      default:
        return '';
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 safe-area-bottom">
      {/* Drone info card */}
      <div className="mx-4 mb-4">
        <div className="glass rounded-2xl p-4 flex items-center gap-4">
          {/* Drone thumbnail */}
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-buzz-purple/20 to-buzz-purple/5 flex items-center justify-center">
            <DroneIcon size={32} className="text-buzz-purple" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <h3 className="font-bold text-lg">{state.selectedDrone?.name || 'Drone-01'}</h3>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-buzz-green" />
              <span className="text-sm text-buzz-green">Ready for Deployment</span>
            </div>
          </div>

          {/* Settings */}
          <button className="p-3 bg-buzz-dark-card rounded-xl hover:bg-buzz-dark-border transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mx-4 mb-4 flex gap-3">
        {/* Cancel */}
        <Button
          variant="outline"
          size="lg"
          onClick={handleCancel}
          className="flex-shrink-0"
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>

        {/* Send to Control Center */}
        <Button
          variant="secondary"
          size="lg"
          onClick={handleSendToControlCenter}
          disabled={state.controlCenterStatus !== 'idle'}
          className={cn(
            'flex-1 border',
            getControlCenterButtonStyle()
          )}
        >
          {renderControlCenterButton()}
        </Button>

        {/* Launch */}
        <Button
          size="lg"
          onClick={handleLaunch}
          className="flex-shrink-0"
        >
          <Rocket className="mr-2 h-4 w-4" />
          Launch
        </Button>
      </div>
    </div>
  );
}

