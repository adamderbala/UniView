import type {
  University,
  ParkingLot,
  OccupancyTrend,
  Campus,
} from "../types/parking";

export const mockUniversities: University[] = [
  {
    id: "rutgers",
    name: "Rutgers University",
    shortName: "Rutgers",
    totalLots: 45,
    totalSpaces: 30000,
  },
  {
    id: "princeton",
    name: "Princeton University",
    shortName: "Princeton",
    totalLots: 28,
    totalSpaces: 12500,
  },
  {
    id: "njit",
    name: "New Jersey Institute of Technology",
    shortName: "NJIT",
    totalLots: 22,
    totalSpaces: 8500,
  },
];

export const rutgersCampuses: Campus[] = [
  {
    id: "busch",
    name: "Busch Campus",
    universityId: "rutgers",
    lotCount: 1,
  },
  {
    id: "college-ave",
    name: "College Avenue",
    universityId: "rutgers",
    lotCount: 10,
  },
  {
    id: "livingston",
    name: "Livingston Campus",
    universityId: "rutgers",
    lotCount: 6,
  },
  {
    id: "cook-douglass",
    name: "Cook/Douglass",
    universityId: "rutgers",
    lotCount: 8,
  },
];

export const mockParkingLots: ParkingLot[] = [
  // Busch Campus
  {
    id: "lot-busch-stadium-west",
    name: "Stadium West Lot",
    campusId: "busch",
    location: "Busch Campus",
    totalSpaces: 520,
    availableSpaces: 211,
    coordinates: { lat: 40.5139, lng: -74.4678 },
    permitTypes: ["Student", "Faculty", "Staff", "Visitor"],
    lastUpdated: new Date(),
  },
  // College Avenue
  {
    id: "lot-ca-1",
    name: "Lot 30",
    campusId: "college-ave",
    location: "Student Center",
    totalSpaces: 320,
    availableSpaces: 45,
    coordinates: { lat: 40.5015, lng: -74.4475 },
    permitTypes: ["Student", "Visitor"],
    lastUpdated: new Date(),
  },
  {
    id: "lot-ca-2",
    name: "Lot 42",
    campusId: "college-ave",
    location: "Alexander Library",
    totalSpaces: 420,
    availableSpaces: 67,
    coordinates: { lat: 40.4997, lng: -74.4467 },
    permitTypes: ["Student", "Faculty", "Visitor"],
    lastUpdated: new Date(),
  },
  // Livingston Campus
  {
    id: "lot-liv-yellow",
    name: "Yellow Lot",
    campusId: "livingston",
    location: "Livingston Campus",
    totalSpaces: 340,
    availableSpaces: 198,
    coordinates: { lat: 40.5279, lng: -74.4387 },
    permitTypes: ["Student", "Faculty", "Staff", "Visitor"],
    lastUpdated: new Date(),
  },
  {
    id: "lot-liv-green",
    name: "Green Lot",
    campusId: "livingston",
    location: "Livingston Campus",
    totalSpaces: 280,
    availableSpaces: 121,
    coordinates: { lat: 40.5267, lng: -74.4399 },
    permitTypes: ["Student", "Faculty", "Staff", "Visitor"],
    lastUpdated: new Date(),
  },
  {
    id: "lot-liv-105",
    name: "Lot 105",
    campusId: "livingston",
    location: "Livingston Campus",
    totalSpaces: 260,
    availableSpaces: 94,
    coordinates: { lat: 40.5246, lng: -74.4339 },
    permitTypes: ["Student", "Faculty", "Staff", "Visitor"],
    lastUpdated: new Date(),
  },
  {
    id: "lot-liv-101",
    name: "Lot 101",
    campusId: "livingston",
    location: "Livingston Campus",
    totalSpaces: 210,
    availableSpaces: 71,
    coordinates: { lat: 40.5213, lng: -74.4378 },
    permitTypes: ["Student", "Faculty", "Staff", "Visitor"],
    lastUpdated: new Date(),
  },
  {
    id: "lot-liv-102",
    name: "Lot 102",
    campusId: "livingston",
    location: "Livingston Campus",
    totalSpaces: 190,
    availableSpaces: 88,
    coordinates: { lat: 40.5214, lng: -74.4361 },
    permitTypes: ["Student", "Faculty", "Staff", "Visitor"],
    lastUpdated: new Date(),
  },
  {
    id: "lot-liv-103",
    name: "Lot 103",
    campusId: "livingston",
    location: "Livingston Campus",
    totalSpaces: 230,
    availableSpaces: 102,
    coordinates: { lat: 40.5208, lng: -74.4326 },
    permitTypes: ["Student", "Faculty", "Staff", "Visitor"],
    lastUpdated: new Date(),
  },
  // Cook/Douglass
  {
    id: "lot-cd-1",
    name: "Lot 11",
    campusId: "cook-douglass",
    location: "Near Passion Puddle",
    totalSpaces: 275,
    availableSpaces: 89,
    coordinates: { lat: 40.4801, lng: -74.4368 },
    permitTypes: ["Student", "Faculty"],
    lastUpdated: new Date(),
  },
  {
    id: "lot-cd-2",
    name: "Lot 82",
    campusId: "cook-douglass",
    location: "SEBS Building",
    totalSpaces: 195,
    availableSpaces: 142,
    coordinates: { lat: 40.4815, lng: -74.4355 },
    permitTypes: ["Student", "Faculty", "Staff"],
    lastUpdated: new Date(),
  },
];

export const generateOccupancyTrend = (): OccupancyTrend[] => {
  const hours = [
    "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM",
    "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM"
  ];
  
  return hours.map((time, index) => ({
    time,
    occupancy: Math.round(
      50 + 40 * Math.sin((index - 2) * Math.PI / 8) + Math.random() * 10
    ),
  }));
};

export const getLotOccupancyPercentage = (lot: ParkingLot): number => {
  return Math.round(((lot.totalSpaces - lot.availableSpaces) / lot.totalSpaces) * 100);
};

export const getOccupancyStatus = (percentage: number): "low" | "medium" | "high" => {
  if (percentage < 50) return "low";
  if (percentage < 85) return "medium";
  return "high";
};

export const getCampusStats = (campusId: string) => {
  const campusLots = mockParkingLots.filter(lot => lot.campusId === campusId);
  const totalSpaces = campusLots.reduce((sum, lot) => sum + lot.totalSpaces, 0);
  const availableSpaces = campusLots.reduce((sum, lot) => sum + lot.availableSpaces, 0);
  const occupancyPercentage = Math.round(((totalSpaces - availableSpaces) / totalSpaces) * 100);
  
  return {
    totalLots: campusLots.length,
    totalSpaces,
    availableSpaces,
    occupancyPercentage,
  };
};
