// In-memory mock database
export interface User {
  id: number;
  serial_number: string;
  name: string;
  created_at: string;
}

export interface Drone {
  id: number;
  name: string;
  type: string;
  status: 'available' | 'in_use' | 'maintenance';
  battery_level: number;
  created_at: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PinnedDrone {
  id: number;
  drone_id: number;
  drone_name: string;
  user_id: string;
  // Configuration data
  controller_altitude: number | null;
  controller_lat: number | null;
  controller_lng: number | null;
  drone_altitude: number | null;
  drone_lat: number | null;
  drone_lng: number | null;
  drone_area: Coordinates[] | null;
  created_at: string;
}

export interface RecentlyUsedDrone {
  id: number;
  drone_id: number;
  drone_name: string;
  user_id: string;
  used_at: string;
}

export interface FlightHistory {
  id: number;
  drone_id: number;
  drone_name: string;
  drone_type: string;
  user_id: string;
  controller_altitude: number;
  controller_lat: number;
  controller_lng: number;
  drone_altitude: number;
  drone_lat: number;
  drone_lng: number;
  operational_area: Coordinates[];
  status: 'Launched' | 'Not Launched';
  control_center_approved: boolean | null;
  created_at: string;
}

// Mock data store
class MockDatabase {
  private users: User[] = [];
  private drones: Drone[] = [];
  private pinnedDrones: PinnedDrone[] = [];
  private recentlyUsedDrones: RecentlyUsedDrone[] = [];
  private flightHistory: FlightHistory[] = [];
  private nextId = {
    user: 1,
    drone: 1,
    pinned: 1,
    recent: 1,
    flight: 1,
  };

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Add mock users
    this.users = [
      { id: this.nextId.user++, serial_number: 'X7-99-ALPHA', name: 'Operator Alpha', created_at: new Date().toISOString() },
      { id: this.nextId.user++, serial_number: 'B3-42-BRAVO', name: 'Operator Bravo', created_at: new Date().toISOString() },
      { id: this.nextId.user++, serial_number: 'C1-88-CHARLIE', name: 'Operator Charlie', created_at: new Date().toISOString() },
    ];

    // Add mock drones
    this.drones = [
      { id: this.nextId.drone++, name: 'Alpha-1', type: 'patrol', status: 'available', battery_level: 78, created_at: new Date().toISOString() },
      { id: this.nextId.drone++, name: 'Svy-04', type: 'survey', status: 'available', battery_level: 15, created_at: new Date().toISOString() },
      { id: this.nextId.drone++, name: 'Cam-7', type: 'camera', status: 'available', battery_level: 92, created_at: new Date().toISOString() },
      { id: this.nextId.drone++, name: 'Recon Unit B2', type: 'recon', status: 'in_use', battery_level: 65, created_at: new Date().toISOString() },
      { id: this.nextId.drone++, name: 'Cargo Heavy-X', type: 'cargo', status: 'available', battery_level: 88, created_at: new Date().toISOString() },
      { id: this.nextId.drone++, name: 'Signal Relay 01', type: 'relay', status: 'maintenance', battery_level: 45, created_at: new Date().toISOString() },
      { id: this.nextId.drone++, name: 'Scout-Delta', type: 'scout', status: 'available', battery_level: 100, created_at: new Date().toISOString() },
      { id: this.nextId.drone++, name: 'Hawk-Eye', type: 'surveillance', status: 'available', battery_level: 72, created_at: new Date().toISOString() },
      { id: this.nextId.drone++, name: 'Phantom-X9', type: 'stealth', status: 'available', battery_level: 95, created_at: new Date().toISOString() },
      { id: this.nextId.drone++, name: 'Drone-01', type: 'general', status: 'available', battery_level: 84, created_at: new Date().toISOString() },
    ];

    console.log('Mock database initialized with data');
  }

  // User operations
  findUserBySerialNumber(serialNumber: string): User | undefined {
    return this.users.find(u => u.serial_number === serialNumber);
  }

  findUserById(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }

  createUser(serialNumber: string, name: string): User {
    const user: User = {
      id: this.nextId.user++,
      serial_number: serialNumber,
      name,
      created_at: new Date().toISOString(),
    };
    this.users.push(user);
    return user;
  }

  // Drone operations
  searchDrones(query: string): Drone[] {
    return this.drones.filter(d => 
      d.name.toLowerCase().includes(query.toLowerCase()) &&
      d.status !== 'maintenance'
    ).slice(0, 10);
  }

  getAllDrones(): Drone[] {
    return this.drones;
  }

  getDroneById(id: number): Drone | undefined {
    return this.drones.find(d => d.id === id);
  }

  // Pinned drones
  getPinnedDrones(userId: string): (PinnedDrone & { type: string; status: string; battery_level: number })[] {
    return this.pinnedDrones
      .filter(p => p.user_id === userId)
      .map(p => {
        const drone = this.drones.find(d => d.id === p.drone_id);
        return {
          ...p,
          type: drone?.type || 'unknown',
          status: drone?.status || 'unknown',
          battery_level: drone?.battery_level || 0,
        };
      });
  }

  pinDrone(
    droneId: number, 
    droneName: string, 
    userId: string,
    config?: {
      controllerAltitude?: number;
      controllerLat?: number;
      controllerLng?: number;
      droneAltitude?: number;
      droneLat?: number;
      droneLng?: number;
      droneArea?: Coordinates[];
    }
  ): { success: boolean; alreadyPinned: boolean } {
    const existing = this.pinnedDrones.find(p => p.drone_id === droneId && p.user_id === userId);
    if (existing) {
      // Update existing with new config if provided
      if (config) {
        existing.controller_altitude = config.controllerAltitude ?? existing.controller_altitude;
        existing.controller_lat = config.controllerLat ?? existing.controller_lat;
        existing.controller_lng = config.controllerLng ?? existing.controller_lng;
        existing.drone_altitude = config.droneAltitude ?? existing.drone_altitude;
        existing.drone_lat = config.droneLat ?? existing.drone_lat;
        existing.drone_lng = config.droneLng ?? existing.drone_lng;
        existing.drone_area = config.droneArea ?? existing.drone_area;
      }
      return { success: true, alreadyPinned: true };
    }
    this.pinnedDrones.push({
      id: this.nextId.pinned++,
      drone_id: droneId,
      drone_name: droneName,
      user_id: userId,
      controller_altitude: config?.controllerAltitude ?? null,
      controller_lat: config?.controllerLat ?? null,
      controller_lng: config?.controllerLng ?? null,
      drone_altitude: config?.droneAltitude ?? null,
      drone_lat: config?.droneLat ?? null,
      drone_lng: config?.droneLng ?? null,
      drone_area: config?.droneArea ?? null,
      created_at: new Date().toISOString(),
    });
    return { success: true, alreadyPinned: false };
  }

  unpinDrone(droneId: number, userId: string): void {
    this.pinnedDrones = this.pinnedDrones.filter(p => !(p.drone_id === droneId && p.user_id === userId));
  }

  // Recently used drones
  getRecentlyUsedDrones(userId: string): (RecentlyUsedDrone & { type: string; status: string; battery_level: number })[] {
    return this.recentlyUsedDrones
      .filter(r => r.user_id === userId)
      .sort((a, b) => new Date(b.used_at).getTime() - new Date(a.used_at).getTime())
      .slice(0, 7)
      .map(r => {
        const drone = this.drones.find(d => d.id === r.drone_id);
        return {
          ...r,
          type: drone?.type || 'unknown',
          status: drone?.status || 'available',
          battery_level: drone?.battery_level || 0,
        };
      });
  }

  addToRecentlyUsed(droneId: number, droneName: string, userId: string): void {
    // Remove existing entry
    this.recentlyUsedDrones = this.recentlyUsedDrones.filter(r => !(r.drone_id === droneId && r.user_id === userId));
    
    // Add new entry
    this.recentlyUsedDrones.push({
      id: this.nextId.recent++,
      drone_id: droneId,
      drone_name: droneName,
      user_id: userId,
      used_at: new Date().toISOString(),
    });
  }

  // Flight history
  saveFlightHistory(data: Omit<FlightHistory, 'id' | 'created_at'>): number {
    const flight: FlightHistory = {
      ...data,
      id: this.nextId.flight++,
      created_at: new Date().toISOString(),
    };
    this.flightHistory.push(flight);
    return flight.id;
  }

  getFlightHistory(userId: string): FlightHistory[] {
    return this.flightHistory
      .filter(f => f.user_id === userId && f.status === 'Launched')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20);
  }
}

export const db = new MockDatabase();
