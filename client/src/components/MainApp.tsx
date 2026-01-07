import { useEffect } from 'react';
import { useApp } from '@/store/AppContext';
import { MapView } from '@/components/map/MapView';
import { TopBar } from '@/components/TopBar';
import { BottomSheet } from '@/components/bottom-sheet/BottomSheet';
import { ConfigurationForm } from '@/components/config/ConfigurationForm';
import { CalculatingOverlay } from '@/components/CalculatingOverlay';
import { ResultActions } from '@/components/ResultActions';

export function MainApp() {
  const { state, dispatch } = useApp();

  // Get user's current location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          dispatch({
            type: 'SET_USER_LOCATION',
            payload: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Default to Tel Aviv if geolocation fails
          dispatch({
            type: 'SET_USER_LOCATION',
            payload: { lat: 32.0853, lng: 34.7818 },
          });
        },
        { enableHighAccuracy: true }
      );
    } else {
      // Default to Tel Aviv
      dispatch({
        type: 'SET_USER_LOCATION',
        payload: { lat: 32.0853, lng: 34.7818 },
      });
    }
  }, [dispatch]);

  return (
    <div className="h-full w-full relative overflow-hidden bg-buzz-dark">
      {/* Map layer */}
      <MapView />

      {/* Top bar overlay */}
      <TopBar />

      {/* Bottom sheet for drone selection */}
      {state.phase === 'idle' && !state.isConfigFormOpen && (
        <BottomSheet />
      )}

      {/* Configuration form */}
      {state.isConfigFormOpen && (
        <ConfigurationForm />
      )}

      {/* Calculating overlay */}
      {state.phase === 'calculating' && (
        <CalculatingOverlay />
      )}

      {/* Result action buttons */}
      {state.phase === 'result' && (
        <ResultActions />
      )}
    </div>
  );
}

