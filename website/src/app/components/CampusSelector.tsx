import type { Campus } from "../types/parking";
import { Badge } from "./ui/badge";
import { ChevronRight, MapPin, Clock, ParkingSquare } from "lucide-react";
import { getCampusStats } from "../utils/mockData";
import { motion } from "framer-motion";

interface CampusSelectorProps {
  campuses: Campus[];
  onSelectCampus: (campusId: string) => void;
}

const campusImages: Record<string, string> = {
  "busch": "https://images.unsplash.com/photo-1664273891579-22f28332f3c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwY2FtcHVzJTIwYnVpbGRpbmclMjBtb2Rlcm58ZW58MXx8fHwxNzcwNjI3Nzc1fDA&ixlib=rb-4.1.0&q=80&w=1080",
  "college-ave": "https://images.unsplash.com/photo-1769209435699-9cc1fd8e7f57?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwcXVhZCUyMHN0dWRlbnRzJTIwd2Fsa2luZ3xlbnwxfHx8fDE3NzA2OTQxNjB8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "livingston": "https://images.unsplash.com/photo-1570937943543-4266379b1c2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1wdXMlMjByZWNyZWF0aW9uJTIwY2VudGVyfGVufDF8fHx8MTc3MDY5NDE2MHww&ixlib=rb-4.1.0&q=80&w=1080",
  "cook-douglass": "https://images.unsplash.com/photo-1664273891579-22f28332f3c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwY2FtcHVzJTIwYnVpbGRpbmclMjBtb2Rlcm58ZW58MXx8fHwxNzcwNjI3Nzc1fDA&ixlib=rb-4.1.0&q=80&w=1080",
};

export function CampusSelector({ campuses, onSelectCampus }: CampusSelectorProps) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <h2 className="text-4xl font-bold">Choose Your Campus</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select a campus to view real-time parking availability and save your favorite spots
          </p>
        </motion.div>

        {/* Campus Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campuses.map((campus, index) => {
            const stats = getCampusStats(campus.id);
            const availabilityPercentage = Math.round((stats.availableSpaces / stats.totalSpaces) * 100);
            const statusColor = stats.occupancyPercentage > 85 ? "bg-red-500" : 
                               stats.occupancyPercentage > 50 ? "bg-yellow-500" : 
                               "bg-green-500";
            const statusText = stats.occupancyPercentage > 85 ? "Limited" : 
                              stats.occupancyPercentage > 50 ? "Moderate" : 
                              "Available";
            
            return (
              <motion.div
                key={campus.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                onClick={() => onSelectCampus(campus.id)}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-xl border bg-card hover:shadow-xl transition-all duration-300 h-full">
                  {/* Image Section */}
                  <div className="relative h-48 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <img 
                      src={campusImages[campus.id]} 
                      alt={campus.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 z-20">
                      <Badge className={`${statusColor} text-white border-0`}>
                        {statusText}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 left-4 z-20">
                      <h3 className="text-2xl font-bold text-white">{campus.name}</h3>
                    </div>
                  </div>

                  {/* Stats Section */}
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <ParkingSquare className="h-4 w-4" />
                          <span>Available Now</span>
                        </div>
                        <p className="text-2xl font-bold text-primary">
                          {stats.availableSpaces}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          of {stats.totalSpaces} spaces
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <MapPin className="h-4 w-4" />
                          <span>Parking Lots</span>
                        </div>
                        <p className="text-2xl font-bold">
                          {stats.totalLots}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          locations
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Availability</span>
                        <span className="font-medium">{availabilityPercentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${statusColor} transition-all duration-500`}
                          style={{ width: `${availabilityPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Updated 30s ago</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full text-sm text-muted-foreground">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live data powered by edge AI camera nodes across campus</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
