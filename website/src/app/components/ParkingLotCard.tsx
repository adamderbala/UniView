import type { ParkingLot } from "../types/parking";
import { getLotOccupancyPercentage, getOccupancyStatus } from "../utils/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { MapPin, Star, StarOff } from "lucide-react";
import { Progress } from "./ui/progress";

interface ParkingLotCardProps {
  lot: ParkingLot;
  isSaved: boolean;
  onToggleSave: (lotId: string) => void;
  onViewMap: (lotId: string) => void;
}

export function ParkingLotCard({ lot, isSaved, onToggleSave, onViewMap }: ParkingLotCardProps) {
  const occupancyPercentage = getLotOccupancyPercentage(lot);
  const status = getOccupancyStatus(occupancyPercentage);
  
  const statusColors = {
    low: "text-green-600",
    medium: "text-yellow-600",
    high: "text-red-600",
  };

  const statusLabels = {
    low: "Available",
    medium: "Moderate",
    high: "Limited",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg mb-1">{lot.name}</CardTitle>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{lot.location}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleSave(lot.id)}
            className="shrink-0 h-8 w-8"
          >
            {isSaved ? (
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{lot.availableSpaces}</span>
            <Badge 
              variant="secondary" 
              className={`${statusColors[status]} font-semibold`}
            >
              {statusLabels[status]}
            </Badge>
          </div>
          <Progress 
            value={occupancyPercentage} 
            className="h-2"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>of {lot.totalSpaces} spaces</span>
            <span>{occupancyPercentage}% occupied</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {lot.permitTypes.map((permit) => (
            <Badge key={permit} variant="outline" className="text-xs">
              {permit}
            </Badge>
          ))}
        </div>

        <Button onClick={() => onViewMap(lot.id)} className="w-full" size="sm">
          <MapPin className="h-4 w-4 mr-2" />
          View on Map
        </Button>
      </CardContent>
    </Card>
  );
}
