import { useEffect, useMemo, useRef, useState } from "react";
import {
  mockUniversities,
  mockParkingLots,
  rutgersCampuses,
  generateOccupancyTrend,
  getLotOccupancyPercentage,
} from "./utils/mockData";
import type { UserPreferences } from "./types/parking";
import type { MapCommand } from "./map/types";
import { getLotIdForMapLot, getMapBindingForLot } from "./map/lotRegistry";
import { OccupancyChart } from "./components/OccupancyChart";
import { SettingsDialog } from "./components/SettingsDialog";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./components/ui/sheet";
import {
  Search,
  Star,
  MapPin,
  TrendingUp,
  ParkingSquare,
  Activity,
  Settings,
  Map,
  Menu,
  Building2,
  Layers,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";

type ViewMode = "map" | "analytics" | "settings";

const navItems: { key: ViewMode; label: string; icon: typeof Map }[] = [
  { key: "map", label: "Map", icon: Map },
  { key: "analytics", label: "Analytics", icon: Activity },
  { key: "settings", label: "Settings", icon: Settings },
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const DEMO_OCCUPANCY_URL = `${API_BASE_URL}/api/demo/occupancy`;
const DEMO_LOT_ID = "lot-liv-yellow";
const MAP_SRC = `/map/map.html?apiBaseUrl=${encodeURIComponent(API_BASE_URL)}`;

interface DemoLotOccupancy {
  totalSpaces: number;
  availableSpaces: number;
}

interface DemoOccupancyResponse {
  lots?: Record<string, DemoLotOccupancy>;
}

export default function App() {
  const [activeView, setActiveView] = useState<ViewMode>("map");
  const [parkingLots, setParkingLots] = useState(mockParkingLots);
  const [selectedUniversity, setSelectedUniversity] = useState<string>(mockUniversities[0].id);
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    selectedUniversity: mockUniversities[0].id,
    savedLots: [],
    notificationsEnabled: true,
    alertThreshold: 50,
  });
  const [occupancyData, setOccupancyData] = useState(generateOccupancyTrend());

  const mapFrameRef = useRef<HTMLIFrameElement | null>(null);

  const filteredCampuses = useMemo(
    () => rutgersCampuses.filter((campus) => campus.universityId === selectedUniversity),
    [selectedUniversity],
  );

  const campusLots = useMemo(
    () => (selectedCampus ? parkingLots.filter((lot) => lot.campusId === selectedCampus) : []),
    [parkingLots, selectedCampus],
  );

  const scopedLots = useMemo(() => {
    if (selectedCampus) return campusLots;
    const campusIds = new Set(filteredCampuses.map((campus) => campus.id));
    return parkingLots.filter((lot) => campusIds.has(lot.campusId));
  }, [selectedCampus, campusLots, filteredCampuses, parkingLots]);

  const filteredLots = useMemo(() => {
    const savedSet = new Set(preferences.savedLots);
    return campusLots
      .filter((lot) => {
        const matchesSearch =
          lot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lot.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSaved = !showSavedOnly || savedSet.has(lot.id);
        return matchesSearch && matchesSaved;
      })
      .sort((a, b) => {
        const aSaved = savedSet.has(a.id);
        const bSaved = savedSet.has(b.id);
        if (aSaved !== bSaved) return aSaved ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [campusLots, searchQuery, showSavedOnly, preferences.savedLots]);

  const selectedCampusName = filteredCampuses.find((campus) => campus.id === selectedCampus)?.name;
  const currentUniversity = mockUniversities.find((university) => university.id === selectedUniversity);
  const selectedLot = parkingLots.find((lot) => lot.id === selectedLotId) ?? null;

  const scopedStats = useMemo(() => {
    const totalSpaces = scopedLots.reduce((sum, lot) => sum + lot.totalSpaces, 0);
    const availableSpaces = scopedLots.reduce((sum, lot) => sum + lot.availableSpaces, 0);

    return {
      totalLots: scopedLots.length,
      totalSpaces,
      availableSpaces,
      occupancyPercentage: totalSpaces > 0 ? Math.round(((totalSpaces - availableSpaces) / totalSpaces) * 100) : 0,
    };
  }, [scopedLots]);

  const savedCount = scopedLots.filter((lot) => preferences.savedLots.includes(lot.id)).length;

  const sendMapCommand = (command: MapCommand) => {
    mapFrameRef.current?.contentWindow?.postMessage(command, window.location.origin);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setOccupancyData(generateOccupancyTrend());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDemoOccupancy() {
      try {
        const response = await fetch(DEMO_OCCUPANCY_URL, { cache: "no-store" });
        if (!response.ok) return;

        const data = (await response.json()) as DemoOccupancyResponse;
        const yellowLot = data.lots?.[DEMO_LOT_ID];
        if (!yellowLot || cancelled) return;

        setParkingLots((currentLots) =>
          currentLots.map((lot) =>
            lot.id === DEMO_LOT_ID
              ? {
                  ...lot,
                  totalSpaces: yellowLot.totalSpaces,
                  availableSpaces: yellowLot.availableSpaces,
                  lastUpdated: new Date(),
                }
              : lot,
          ),
        );
      } catch (error) {
        console.error("Could not load demo occupancy data", error);
      }
    }

    loadDemoOccupancy();
    const interval = window.setInterval(loadDemoOccupancy, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleMapMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || !event.data || typeof event.data !== "object") return;

      if (event.data.type === "uniview:map-campus-selected" && typeof event.data.campusId === "string") {
        setSelectedCampus(event.data.campusId);
        setSelectedLotId(null);
        setActiveView("map");
      }

      if (event.data.type === "uniview:map-lot-selected") {
        const campusId = typeof event.data.campusId === "string" ? event.data.campusId : null;
        const appLotIdFromMessage =
          typeof event.data.appLotId === "string"
            ? event.data.appLotId
            : typeof event.data.mapLotId === "string"
              ? getLotIdForMapLot(event.data.mapLotId) ?? null
              : null;

        if (campusId) setSelectedCampus(campusId);
        if (appLotIdFromMessage) setSelectedLotId(appLotIdFromMessage);
        setActiveView("map");
      }
    };

    window.addEventListener("message", handleMapMessage);
    return () => window.removeEventListener("message", handleMapMessage);
  }, []);

  useEffect(() => {
    setPreferences((prev) => ({ ...prev, selectedUniversity }));
  }, [selectedUniversity]);

  useEffect(() => {
    if (selectedCampus && !filteredCampuses.some((campus) => campus.id === selectedCampus)) {
      setSelectedCampus(null);
      setSelectedLotId(null);
      setSearchQuery("");
    }
  }, [filteredCampuses, selectedCampus]);

  useEffect(() => {
    if (selectedCampus) {
      sendMapCommand({ type: "uniview:set-campus", campusId: selectedCampus });
    } else {
      sendMapCommand({ type: "uniview:reset-view" });
    }
  }, [selectedCampus]);

  useEffect(() => {
    if (selectedLotId) {
      const lot = parkingLots.find((candidate) => candidate.id === selectedLotId);
      if (!lot || lot.campusId !== selectedCampus) {
        setSelectedLotId(null);
      }
    }
  }, [parkingLots, selectedCampus, selectedLotId]);

  const handleToggleSave = (lotId: string) => {
    const isSaved = preferences.savedLots.includes(lotId);
    const newSavedLots = isSaved
      ? preferences.savedLots.filter((id) => id !== lotId)
      : [...preferences.savedLots, lotId];

    setPreferences({ ...preferences, savedLots: newSavedLots });
    toast.success(isSaved ? "Lot removed from favorites" : "Lot saved to favorites");
  };

  const handleFocusLot = (lotId: string) => {
    setSelectedLotId(lotId);
    setActiveView("map");
    setMobileSidebarOpen(false);

    const binding = getMapBindingForLot(lotId);
    if (!binding || binding.status !== "ready") {
      toast.info("Lot selected. Overlay is not initialized yet.");
      return;
    }

    sendMapCommand({ type: "uniview:focus-lot", lotId: binding.mapLotId });
  };

  const handleResetMapView = () => {
    setSelectedCampus(null);
    setSelectedLotId(null);
    setSearchQuery("");
    sendMapCommand({ type: "uniview:reset-view" });
    toast.success("Map reset to campus overview.");
  };

  const renderSidebar = (variant: "docked" | "floating" = "docked") => (
    <div
      className={`h-full flex flex-col bg-white ${
        variant === "docked"
          ? "border-r-2 border-black/40"
          : "border border-black/40 rounded-2xl overflow-hidden shadow-2xl bg-white/95 backdrop-blur-sm"
      }`}
    >
      <div className="p-5 border-b border-black/35 space-y-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Navigation</p>
            <h2 className="font-bold text-xl text-slate-900">Campus & Lot Browser</h2>
          </div>
          <Button variant="outline" size="icon" className="border-slate-300" onClick={handleResetMapView}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-1.5">
          <label className="text-base text-slate-900 flex items-center gap-1.5 font-bold">
            <Building2 className="h-4 w-4 text-primary" /> University
          </label>
          <Select
            value={selectedUniversity}
            onValueChange={(value) => {
              setSelectedUniversity(value);
              setSelectedCampus(null);
              setSelectedLotId(null);
            }}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select university" />
            </SelectTrigger>
            <SelectContent>
              {mockUniversities.map((university) => (
                <SelectItem key={university.id} value={university.id}>
                  {university.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-black/35 bg-slate-50/60">
        <div className="flex items-center justify-between mb-3">
          <p className="text-base font-bold text-slate-900 flex items-center gap-1.5">
            <Layers className="h-4.5 w-4.5 text-primary" /> Campus
          </p>
          <Badge variant="outline" className="text-[10px]">
            {filteredCampuses.length}
          </Badge>
        </div>
        <div className="space-y-2">
          {filteredCampuses.map((campus) => (
            <button
              key={campus.id}
              type="button"
              onClick={() => {
                setSelectedCampus(campus.id);
                setSelectedLotId(null);
                setActiveView("map");
              }}
              className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                selectedCampus === campus.id
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-slate-300 hover:bg-slate-50 text-slate-800"
              }`}
            >
              <p className="font-semibold text-base">{campus.name}</p>
                <p className="text-xs text-slate-500">{campus.lotCount} configured lots</p>
              </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4 border-b border-black/35 space-y-3 bg-white">
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-slate-900 flex items-center gap-1.5">
            <ParkingSquare className="h-4.5 w-4.5 text-primary" /> Parking Lots
          </p>
          <Button
            variant={showSavedOnly ? "default" : "outline"}
            size="sm"
            className="h-8"
            disabled={!selectedCampus}
            onClick={() => setShowSavedOnly((prev) => !prev)}
          >
            <Star className={`h-3.5 w-3.5 mr-1 ${showSavedOnly ? "fill-current" : ""}`} />
            Saved
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={selectedCampus ? "Search lot" : "Select a campus"}
            className="pl-9"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            disabled={!selectedCampus}
          />
        </div>
      </div>

      <div className="px-5 py-3 border-b border-black/35 bg-slate-50/80 grid grid-cols-2 gap-2 text-sm">
        <Card className="shadow-none">
          <CardContent className="p-3">
            <p className="text-slate-500 text-xs">Available</p>
            <p className="font-bold text-lg text-slate-900">{scopedStats.availableSpaces}</p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="p-3">
            <p className="text-slate-500 text-xs">Occupancy</p>
            <p className="font-bold text-lg text-slate-900">{scopedStats.occupancyPercentage}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>{selectedCampusName ? `Lots in ${selectedCampusName}` : "Select a campus from map or sidebar"}</span>
          <span>{selectedCampus ? filteredLots.length : 0}</span>
        </div>

        {!selectedCampus ? (
          <div className="text-sm text-slate-600 p-4 text-center bg-slate-50 border border-slate-200 rounded-lg">
            You can click a campus on the map or pick one here.
          </div>
        ) : filteredLots.length === 0 ? (
          <div className="text-sm text-slate-600 p-4 text-center bg-slate-50 border border-slate-200 rounded-lg">
            No lots match your filters.
          </div>
        ) : (
          filteredLots.map((lot) => {
            const isSaved = preferences.savedLots.includes(lot.id);
            const occupancy = getLotOccupancyPercentage(lot);
            const mapBinding = getMapBindingForLot(lot.id);
            const mapReady = mapBinding?.status === "ready";

            return (
              <button
                type="button"
                key={lot.id}
                onClick={() => handleFocusLot(lot.id)}
                className={`w-full text-left border rounded-lg p-3 bg-white hover:bg-slate-50 transition-colors ${
                  selectedLotId === lot.id ? "border-primary bg-primary/5" : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-base text-slate-900">{lot.name}</p>
                      <Badge variant={mapReady ? "default" : "outline"} className="text-[10px] h-5">
                        {mapReady ? "Ready" : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{lot.location}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleToggleSave(lot.id);
                    }}
                  >
                    <Star className={`h-4 w-4 ${isSaved ? "fill-yellow-500 text-yellow-500" : "text-slate-500"}`} />
                  </Button>
                </div>

                <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full ${occupancy >= 85 ? "bg-red-600" : occupancy >= 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${occupancy}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                  <span>{lot.availableSpaces} / {lot.totalSpaces} free</span>
                  <span className="inline-flex items-center gap-1 text-primary">
                    Open
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-white flex flex-col">
      <Toaster />

      <header className="h-20 border-b border-slate-200 bg-white flex items-center justify-between px-4 md:px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden h-10 w-10 border-slate-300">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[370px] sm:max-w-none">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>Campus and parking lot controls</SheetDescription>
              </SheetHeader>
              {renderSidebar("docked")}
            </SheetContent>
          </Sheet>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-primary">UniView</h1>
              <span className="inline-flex items-center rounded-md border border-red-200 bg-white px-2 py-1 text-xs">
                <span className="text-black">Powered by</span>
                <span className="ml-1 font-semibold text-red-700">Verizon</span>
              </span>
            </div>
            <div className="hidden md:flex items-center text-sm font-medium text-slate-700 mt-1">
              {currentUniversity?.name}
              {selectedCampusName && (
                <>
                  <span className="mx-2 text-slate-400">•</span>
                  <span>{selectedCampusName}</span>
                </>
              )}
              {selectedLot && (
                <>
                  <span className="mx-2 text-slate-400">•</span>
                  <span className="text-slate-900">{selectedLot.name}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-2 rounded-xl border border-slate-200 p-1.5 bg-slate-50">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.key;
            return (
              <Button
                key={item.key}
                variant={active ? "default" : "ghost"}
                size="sm"
                className={`h-10 px-4 text-sm ${active ? "" : "text-slate-700 hover:bg-slate-100"}`}
                onClick={() => setActiveView(item.key)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </header>

      <div className="flex-1 min-h-0 flex">
        {activeView !== "map" && (
          <aside className="hidden md:block w-[390px] min-w-[340px] max-w-[440px]">{renderSidebar("docked")}</aside>
        )}

        <main className="flex-1 min-h-0 bg-slate-50">
          {activeView === "map" && (
            <div className="relative h-full">
              <iframe
                ref={mapFrameRef}
                title="UniView parking map"
                src={MAP_SRC}
                className="h-full w-full border-0"
              />
              <div className="hidden md:block absolute left-4 top-4 bottom-4 w-[390px] min-w-[340px] max-w-[420px]">
                {renderSidebar("floating")}
              </div>
            </div>
          )}

          {activeView === "analytics" && (
            <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <ParkingSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{scopedStats.availableSpaces}</p>
                        <p className="text-xs text-slate-500">Available Now</p>
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
                        <p className="text-2xl font-bold">{scopedStats.occupancyPercentage}%</p>
                        <p className="text-xs text-slate-500">Occupancy</p>
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
                        <p className="text-2xl font-bold">{scopedStats.totalLots}</p>
                        <p className="text-xs text-slate-500">Tracked Lots</p>
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
                        <p className="text-xs text-slate-500">Favorite Lots</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <OccupancyChart data={occupancyData} title={`${selectedCampusName ?? "University"} - Occupancy Trend`} />

              <Card>
                <CardHeader>
                  <CardTitle>Lot Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scopedLots.map((lot) => (
                    <div key={lot.id} className="flex items-center justify-between border rounded-lg px-3 py-2 bg-white">
                      <div>
                        <p className="font-medium">{lot.name}</p>
                        <p className="text-xs text-slate-500">{lot.location}</p>
                      </div>
                      <Badge variant="secondary">{getLotOccupancyPercentage(lot)}% occupied</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {activeView === "settings" && (
            <div className="h-full overflow-y-auto p-4 md:p-6">
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle>Dashboard Settings</CardTitle>
                  <p className="text-sm text-slate-500">
                    Tune alerts and customize how occupancy updates are surfaced for your saved lots.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between border rounded-lg px-4 py-3 bg-white">
                    <div>
                      <p className="font-medium">Notification Alerts</p>
                      <p className="text-xs text-slate-500">
                        {preferences.notificationsEnabled ? "Enabled" : "Disabled"} at {preferences.alertThreshold}% threshold
                      </p>
                    </div>
                    <SettingsDialog
                      preferences={preferences}
                      onUpdatePreferences={(newPreferences) => {
                        setPreferences(newPreferences);
                        toast.success("Settings updated successfully");
                      }}
                    />
                  </div>

                  <div className="text-sm text-slate-500 border rounded-lg px-4 py-3 bg-white">
                    Saved lots: <span className="font-semibold text-slate-900">{preferences.savedLots.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
