export interface ParkingLot {
  id: string;
  name: string;
  campusId: string;
  location: string;
  totalSpaces: number;
  availableSpaces: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  permitTypes: string[];
  lastUpdated: Date;
}

export interface University {
  id: string;
  name: string;
  shortName: string;
  totalLots: number;
  totalSpaces: number;
}

export interface Campus {
  id: string;
  name: string;
  universityId: string;
  lotCount: number;
}

export interface OccupancyPoint {
  time: string;
  occupancy: number;
}

export interface ParkingSpot {
  id: string;
  lotId: string;
  isOccupied: boolean;
  lastUpdated: string;
}

export interface UserPreferences {
  selectedUniversity: string;
  savedLots: string[];
  notificationsEnabled: boolean;
  alertThreshold: number;
}
