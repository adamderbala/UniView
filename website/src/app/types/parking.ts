export interface ParkingLot {
  id: string;
  name: string;
  campusId: string;
  totalSpaces: number;
  occupiedSpaces: number;
  availableSpaces: number;
  lastUpdated: string;
}

export interface University {
  id: string;
  name: string;
}

export interface Campus {
  id: string;
  name: string;
  universityId: string;
  lotCount: number;
}

export interface OccupancyPoint {
  label: string;
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
