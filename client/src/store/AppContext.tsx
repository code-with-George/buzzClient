import { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
interface Coordinates {
  lat: number;
  lng: number;
}

interface DroneConfig {
  altitude: number;
  location: Coordinates | null;
  drawnArea: Coordinates[] | null; // Polygon coordinates for the operational area
}

interface ControllerConfig {
  altitude: number;
  location: Coordinates | null;
}

interface SelectedDrone {
  id: number;
  name: string;
  type: string;
  batteryLevel: number;
}

interface CalculationResult {
  imageData: string;
  calculatedAt: string;
}

type PlacementMode = 'none' | 'controller' | 'drawing';
type AppPhase = 'idle' | 'configuring' | 'calculating' | 'result';
type ControlCenterStatus = 'idle' | 'sending' | 'approved' | 'not_approved';

interface AppState {
  // Auth
  isAuthenticated: boolean;
  userId: string | null;
  
  // User location
  userLocation: Coordinates | null;
  
  // Drone selection
  selectedDrone: SelectedDrone | null;
  
  // Configuration
  controllerConfig: ControllerConfig;
  droneConfig: DroneConfig;
  
  // App state
  phase: AppPhase;
  placementMode: PlacementMode;
  
  // Calculation
  calculationResult: CalculationResult | null;
  controlCenterStatus: ControlCenterStatus;
  
  // Launch state
  isLaunched: boolean;
  
  // UI state
  isBottomSheetExpanded: boolean;
  isConfigFormOpen: boolean;
}

interface SelectDroneWithConfigPayload {
  drone: SelectedDrone;
  controllerConfig?: {
    altitude: number;
    location: Coordinates | null;
  };
  droneConfig?: {
    altitude: number;
    location: Coordinates | null;
    drawnArea: Coordinates[] | null;
  };
}

type Action =
  | { type: 'SET_AUTHENTICATED'; payload: { isAuthenticated: boolean; userId: string | null } }
  | { type: 'SET_USER_LOCATION'; payload: Coordinates }
  | { type: 'SELECT_DRONE'; payload: SelectedDrone }
  | { type: 'SELECT_DRONE_WITH_CONFIG'; payload: SelectDroneWithConfigPayload }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_CONTROLLER_ALTITUDE'; payload: number }
  | { type: 'SET_CONTROLLER_LOCATION'; payload: Coordinates }
  | { type: 'SET_DRONE_ALTITUDE'; payload: number }
  | { type: 'SET_DRONE_LOCATION'; payload: Coordinates }
  | { type: 'SET_DRONE_AREA'; payload: Coordinates[] }
  | { type: 'CLEAR_DRONE_AREA' }
  | { type: 'SET_PHASE'; payload: AppPhase }
  | { type: 'SET_PLACEMENT_MODE'; payload: PlacementMode }
  | { type: 'SET_CALCULATION_RESULT'; payload: CalculationResult }
  | { type: 'SET_CONTROL_CENTER_STATUS'; payload: ControlCenterStatus }
  | { type: 'SET_BOTTOM_SHEET_EXPANDED'; payload: boolean }
  | { type: 'SET_CONFIG_FORM_OPEN'; payload: boolean }
  | { type: 'SET_LAUNCHED'; payload: boolean }
  | { type: 'RESET_DEPLOYMENT' };

const initialState: AppState = {
  isAuthenticated: false,
  userId: null,
  userLocation: null,
  selectedDrone: null,
  controllerConfig: {
    altitude: 0,
    location: null,
  },
  droneConfig: {
    altitude: 0,
    location: null,
    drawnArea: null,
  },
  phase: 'idle',
  placementMode: 'none',
  calculationResult: null,
  controlCenterStatus: 'idle',
  isLaunched: false,
  isBottomSheetExpanded: false,
  isConfigFormOpen: false,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_AUTHENTICATED':
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        userId: action.payload.userId,
      };
    case 'SET_USER_LOCATION':
      return { ...state, userLocation: action.payload };
    case 'SELECT_DRONE':
      return {
        ...state,
        selectedDrone: action.payload,
        isConfigFormOpen: true,
        isBottomSheetExpanded: false,
        phase: 'configuring',
      };
    case 'SELECT_DRONE_WITH_CONFIG':
      return {
        ...state,
        selectedDrone: action.payload.drone,
        controllerConfig: action.payload.controllerConfig || state.controllerConfig,
        droneConfig: action.payload.droneConfig || state.droneConfig,
        isConfigFormOpen: true,
        isBottomSheetExpanded: false,
        phase: 'configuring',
      };
    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedDrone: null,
        isConfigFormOpen: false,
        phase: 'idle',
      };
    case 'SET_CONTROLLER_ALTITUDE':
      return {
        ...state,
        controllerConfig: { ...state.controllerConfig, altitude: action.payload },
      };
    case 'SET_CONTROLLER_LOCATION':
      return {
        ...state,
        controllerConfig: { ...state.controllerConfig, location: action.payload },
        placementMode: 'none',
      };
    case 'SET_DRONE_ALTITUDE':
      return {
        ...state,
        droneConfig: { ...state.droneConfig, altitude: action.payload },
      };
    case 'SET_DRONE_LOCATION':
      return {
        ...state,
        droneConfig: { ...state.droneConfig, location: action.payload },
        placementMode: 'none',
      };
    case 'SET_DRONE_AREA':
      return {
        ...state,
        droneConfig: { ...state.droneConfig, drawnArea: action.payload },
        placementMode: 'none',
      };
    case 'CLEAR_DRONE_AREA':
      return {
        ...state,
        droneConfig: { ...state.droneConfig, drawnArea: null, location: null },
      };
    case 'SET_PHASE':
      return { ...state, phase: action.payload };
    case 'SET_PLACEMENT_MODE':
      return { ...state, placementMode: action.payload };
    case 'SET_CALCULATION_RESULT':
      return {
        ...state,
        calculationResult: action.payload,
        phase: 'result',
      };
    case 'SET_CONTROL_CENTER_STATUS':
      return { ...state, controlCenterStatus: action.payload };
    case 'SET_BOTTOM_SHEET_EXPANDED':
      return { ...state, isBottomSheetExpanded: action.payload };
    case 'SET_CONFIG_FORM_OPEN':
      return { ...state, isConfigFormOpen: action.payload };
    case 'SET_LAUNCHED':
      return { ...state, isLaunched: action.payload };
    case 'RESET_DEPLOYMENT':
      return {
        ...state,
        selectedDrone: null,
        controllerConfig: { altitude: 0, location: null },
        droneConfig: { altitude: 0, location: null, drawnArea: null },
        phase: 'idle',
        placementMode: 'none',
        calculationResult: null,
        controlCenterStatus: 'idle',
        isLaunched: false,
        isConfigFormOpen: false,
      };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export type { AppState, Coordinates, SelectedDrone, CalculationResult };
