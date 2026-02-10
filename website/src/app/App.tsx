import { useState, useEffect } from "react";
import { mockUniversities, mockParkingLots, rutgersCampuses, generateOccupancyTrend, getCampusStats } from "./utils/mockData";
import type { UserPreferences, Campus } from "./types/parking";
import { UniversitySelector } from "./components/UniversitySelector";
import { CampusSelector } from "./components/CampusSelector";
import { ParkingLotCard } from "./components/ParkingLotCard";
import { OccupancyChart } from "./components/OccupancyChart";
import { SettingsDialog } from "./components/SettingsDialog";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { Card, CardContent } from "./components/ui/card";
import { Search, ArrowLeft, Star, MapPin, TrendingUp, ParkingSquare } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [preferences, setPreferences] = useState<UserPreferences>({
    selectedUniversity: "",
    savedLots: [],
    notificationsEnabled: true,
    alertThreshold: 50,
  });
  const [occupancyData, setOccupancyData] = useState(generateOccupancyTrend());
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const currentUniversity = mockUniversities.find(u => u.id === selectedUniversity);
  const currentCampus = rutgersCampuses.find(c => c.id === selectedCampus);
  
  // Filter parking lots
  const campusLots = mockParkingLots.filter(lot => lot.campusId === selectedCampus);
  const filteredLots = campusLots.filter(lot => {
    const matchesSearch = lot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lot.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSaved = !showSavedOnly || preferences.savedLots.includes(lot.id);
    return matchesSearch && matchesSaved;
  });

  const savedCount = campusLots.filter(lot => preferences.savedLots.includes(lot.id)).length;
  const campusStats = selectedCampus ? getCampusStats(selectedCampus) : null;

  const handleSelectUniversity = (universityId: string) => {
    setSelectedUniversity(universityId);
    setPreferences({ ...preferences, selectedUniversity: universityId });
  };

  const handleSelectCampus = (campusId: string) => {
    setSelectedCampus(campusId);
  };

  const handleBack = () => {
    if (selectedCampus) {
      setSelectedCampus(null);
      setSearchQuery("");
      setShowSavedOnly(false);
    } else if (selectedUniversity) {
      setSelectedUniversity(null);
    }
  };

  const handleToggleSave = (lotId: string) => {
    const newSavedLots = preferences.savedLots.includes(lotId)
      ? preferences.savedLots.filter(id => id !== lotId)
      : [...preferences.savedLots, lotId];
    
    setPreferences({ ...preferences, savedLots: newSavedLots });
    
    toast.success(
      newSavedLots.includes(lotId) 
        ? "Lot saved to favorites" 
        : "Lot removed from favorites"
    );
  };

const handleViewMap = (_lotId: string) => {
  window.open("/map/map.html", "_blank");
};




  const handleUpdatePreferences = (newPreferences: UserPreferences) => {
    setPreferences(newPreferences);
    toast.success("Settings updated successfully");
  };

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setOccupancyData(generateOccupancyTrend());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      
      {/* Header */}
      <header className="border-b bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(selectedUniversity || selectedCampus) && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleBack}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-primary">UniView</h1>
                  <Badge variant="outline" className="text-xs">Powered by Verizon</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentCampus ? currentCampus.name : 
                   currentUniversity ? currentUniversity.shortName : 
                   "Smart Campus Parking"}
                </p>
              </div>
            </div>
            
            {selectedCampus && (
              <div className="flex items-center gap-2">
                <SettingsDialog 
                  preferences={preferences}
                  onUpdatePreferences={handleUpdatePreferences}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* University Selection */}
        {!selectedUniversity && (
          <UniversitySelector 
            universities={mockUniversities}
            onSelectUniversity={handleSelectUniversity}
          />
        )}

        {/* Campus Selection */}
        {selectedUniversity && !selectedCampus && (
          <CampusSelector 
            campuses={rutgersCampuses}
            onSelectCampus={handleSelectCampus}
          />
        )}

        {/* Parking Lots View */}
        {selectedCampus && campusStats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <ParkingSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{campusStats.availableSpaces}</p>
                      <p className="text-xs text-muted-foreground">Available Now</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{campusStats.occupancyPercentage}%</p>
                      <p className="text-xs text-muted-foreground">Occupancy</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{campusStats.totalLots}</p>
                      <p className="text-xs text-muted-foreground">Parking Lots</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{savedCount}</p>
                      <p className="text-xs text-muted-foreground">Saved Lots</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Occupancy Chart */}
            <OccupancyChart data={occupancyData} title={`${currentCampus?.name} - Today's Trend`} />

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search parking lots..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Button
                variant={showSavedOnly ? "default" : "outline"}
                onClick={() => setShowSavedOnly(!showSavedOnly)}
                className="sm:w-auto"
              >
                <Star className={`h-4 w-4 mr-2 ${showSavedOnly ? 'fill-current' : ''}`} />
                Saved Only
                {savedCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {savedCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Parking Lots Grid */}
            {filteredLots.length === 0 ? (
              <div className="text-center py-16">
                <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">
                  {showSavedOnly ? "No saved lots yet" : "No lots found"}
                </h3>
                <p className="text-muted-foreground">
                  {showSavedOnly 
                    ? "Click the star icon on any parking lot to save it" 
                    : "Try adjusting your search"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLots.map(lot => (
                  <ParkingLotCard
                    key={lot.id}
                    lot={lot}
                    isSaved={preferences.savedLots.includes(lot.id)}
                    onToggleSave={handleToggleSave}
                    onViewMap={handleViewMap}
                  />
                ))}
              </div>
            )}

            {/* Live Data Info */}
            <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span>Live data from edge AI camera nodes • Updates every 30 seconds</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
