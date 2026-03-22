import type { Campus, ParkingLot, ParkingSpot, University } from "./types/parking";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

interface ApiUniversity {
  id: string;
  name: string;
}

interface ApiCampus {
  id: string;
  university_id: string;
  name: string;
  lot_count: number;
}

interface ApiParkingLot {
  id: string;
  campus_id: string;
  name: string;
  total_spaces: number;
  occupied_spaces: number;
  available_spaces: number;
  last_updated: string;
}

interface ApiParkingSpot {
  id: string;
  lot_id: string;
  is_occupied: boolean;
  last_updated: string;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export function getUniversities(): Promise<University[]> {
  return fetchJson<ApiUniversity[]>("/api/universities").then((items) =>
    items.map((item) => ({
      id: item.id,
      name: item.name,
    })),
  );
}

export function getCampuses(universityId?: string): Promise<Campus[]> {
  const query = universityId ? `?university_id=${encodeURIComponent(universityId)}` : "";
  return fetchJson<ApiCampus[]>(`/api/campuses${query}`).then((items) =>
    items.map((item) => ({
      id: item.id,
      universityId: item.university_id,
      name: item.name,
      lotCount: item.lot_count,
    })),
  );
}

export function getLots(campusId?: string): Promise<ParkingLot[]> {
  const query = campusId ? `?campus_id=${encodeURIComponent(campusId)}` : "";
  return fetchJson<ApiParkingLot[]>(`/api/lots${query}`).then((items) =>
    items.map((item) => ({
      id: item.id,
      campusId: item.campus_id,
      name: item.name,
      totalSpaces: item.total_spaces,
      occupiedSpaces: item.occupied_spaces,
      availableSpaces: item.available_spaces,
      lastUpdated: item.last_updated,
    })),
  );
}

export function getLotSpots(lotId: string): Promise<ParkingSpot[]> {
  return fetchJson<ApiParkingSpot[]>(`/api/lots/${encodeURIComponent(lotId)}/spots`).then((items) =>
    items.map((item) => ({
      id: item.id,
      lotId: item.lot_id,
      isOccupied: item.is_occupied,
      lastUpdated: item.last_updated,
    })),
  );
}
