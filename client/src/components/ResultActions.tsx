import { useState } from 'react';
import { CheckCircle, Loader2, User, Users, X, Send, Rocket, LogOut } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';

type DialogStep = 'none' | 'confirm' | 'who-ended';

export function ResultActions() {
  const { state, dispatch } = useApp();
  const utils = trpc.useUtils();
  const [dialogStep, setDialogStep] = useState<DialogStep>('none');
  
  const saveToHistory = trpc.flight.saveToHistory.useMutation({
    onSuccess: () => {
      // Invalidate flight history to refresh the list immediately
      utils.flight.getHistory.invalidate();
    },
  });

  const requestApproval = trpc.flight.requestApproval.useMutation({
    onSuccess: (result) => {
      dispatch({
        type: 'SET_CONTROL_CENTER_STATUS',
        payload: result.approved ? 'approved' : 'not_approved',
      });
    },
    onError: () => {
      dispatch({
        type: 'SET_CONTROL_CENTER_STATUS',
        payload: 'not_approved',
      });
    },
  });

  // Handle Cancel - save "Not Launched" and reset
  const handleCancel = async () => {
    if (!state.selectedDrone || !state.controllerConfig.location || !state.droneConfig.location || !state.droneConfig.drawnArea) {
      dispatch({ type: 'RESET_DEPLOYMENT' });
      return;
    }

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

  // Handle Send to Control Center
  const handleSendToControlCenter = () => {
    if (!state.selectedDrone) return;
    
    dispatch({ type: 'SET_CONTROL_CENTER_STATUS', payload: 'sending' });
    
    requestApproval.mutate({
      droneId: state.selectedDrone.id,
      droneName: state.selectedDrone.name,
    });
  };

  // Handle Launch - save "Launched" and transition to launched state
  const handleLaunch = async () => {
    if (!state.selectedDrone || !state.controllerConfig.location || !state.droneConfig.location || !state.droneConfig.drawnArea) {
      return;
    }

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

    dispatch({ type: 'SET_LAUNCHED', payload: true });
  };

  // Get control center button text and state
  const getControlCenterButtonContent = () => {
    switch (state.controlCenterStatus) {
      case 'sending':
        return {
          text: 'שולח...',
          icon: <Loader2 className="ms-2 h-5 w-5 animate-spin" />,
          disabled: true,
        };
      case 'approved':
        return {
          text: 'אושר',
          icon: <CheckCircle className="ms-2 h-5 w-5 text-buzz-green" />,
          disabled: true,
          className: 'border-buzz-green/30 bg-buzz-green/10 text-buzz-green',
        };
      case 'not_approved':
        return {
          text: 'לא אושר',
          icon: <X className="ms-2 h-5 w-5 text-red-400" />,
          disabled: true,
          className: 'border-red-500/30 bg-red-500/10 text-red-400',
        };
      default:
        return {
          text: 'שלח למוקד בקרה',
          icon: <Send className="ms-2 h-5 w-5" />,
          disabled: false,
        };
    }
  };

  // End flight dialog flow
  const handleEndClick = () => {
    setDialogStep('confirm');
  };

  const handleConfirmEnd = () => {
    setDialogStep('who-ended');
  };

  const handleDialogCancel = () => {
    setDialogStep('none');
  };

  const handleWhoEnded = (_endedBy: 'self' | 'other') => {
    setDialogStep('none');
    // Just reset - history was already saved when Launch was clicked
    dispatch({ type: 'RESET_DEPLOYMENT' });
  };

  const controlCenterButton = getControlCenterButtonContent();

  // Show End button if drone is launched
  if (state.isLaunched) {
    return (
      <>
        <div className="absolute inset-x-0 bottom-0 z-30 safe-area-bottom">
          <div className="mx-4 mb-4">
            <Button
              size="xl"
              onClick={handleEndClick}
              className="w-full"
            >
              <LogOut className="ms-2 h-5 w-5" />
              סיום
            </Button>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={dialogStep === 'confirm'} onOpenChange={(open) => !open && handleDialogCancel()}>
          <DialogContent className="max-w-sm">
            <DialogHeader className="text-right">
              <DialogTitle className="text-xl">סיום טיסה</DialogTitle>
              <DialogDescription className="text-right">
                האם אתה בטוח שברצונך לסיים את הטיסה?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-row gap-3 sm:justify-start">
              <Button
                variant="secondary"
                onClick={handleDialogCancel}
                className="flex-1"
              >
                ביטול
              </Button>
              <Button
                onClick={handleConfirmEnd}
                className="flex-1"
              >
                כן, סיים טיסה
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Who Ended Dialog */}
        <Dialog open={dialogStep === 'who-ended'} onOpenChange={(open) => !open && handleDialogCancel()}>
          <DialogContent className="max-w-sm">
            <DialogHeader className="text-right">
              <DialogTitle className="text-xl">מי סיים את הטיסה?</DialogTitle>
              <DialogDescription className="text-right">
                בחר מי ביצע את סיום הטיסה
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              <Button
                variant="secondary"
                size="xl"
                onClick={() => handleWhoEnded('self')}
                className="w-full justify-start gap-3 h-16"
              >
                <User className="h-6 w-6 text-buzz-purple" />
                <span className="text-base">אני סיימתי את הטיסה</span>
              </Button>
              <Button
                variant="secondary"
                size="xl"
                onClick={() => handleWhoEnded('other')}
                className="w-full justify-start gap-3 h-16"
              >
                <Users className="h-6 w-6 text-buzz-purple" />
                <span className="text-base">מישהו אחר סיים את הטיסה</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Show 3 action buttons before launch
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 safe-area-bottom">
      <div className="mx-4 mb-4 space-y-3">
        {/* Cancel Button */}
        <Button
          variant="destructive"
          size="xl"
          onClick={handleCancel}
          className="w-full"
          disabled={saveToHistory.isPending}
        >
          {saveToHistory.isPending ? (
            <>
              <Loader2 className="ms-2 h-5 w-5 animate-spin" />
              מבטל...
            </>
          ) : (
            <>
              <X className="ms-2 h-5 w-5" />
              ביטול
            </>
          )}
        </Button>

        {/* Send to Control Center Button */}
        <Button
          variant="secondary"
          size="xl"
          onClick={handleSendToControlCenter}
          className={`w-full ${controlCenterButton.className || ''}`}
          disabled={controlCenterButton.disabled}
        >
          {controlCenterButton.icon}
          {controlCenterButton.text}
        </Button>

        {/* Launch Button */}
        <Button
          size="xl"
          onClick={handleLaunch}
          className="w-full"
          disabled={saveToHistory.isPending}
        >
          {saveToHistory.isPending ? (
            <>
              <Loader2 className="ms-2 h-5 w-5 animate-spin" />
              משגר...
            </>
          ) : (
            <>
              <Rocket className="ms-2 h-5 w-5" />
              שיגור
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
