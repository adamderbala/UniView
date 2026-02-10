import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Building2, MapPin, Users, TrendingUp } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: "building" | "map" | "users" | "trending";
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const iconMap = {
  building: Building2,
  map: MapPin,
  users: Users,
  trending: TrendingUp,
};

export function StatsCard({ title, value, subtitle, icon, trend }: StatsCardProps) {
  const Icon = iconMap[icon];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className={`text-xs mt-1 ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
            {trend.isPositive ? "+" : ""}{trend.value}% from last week
          </div>
        )}
      </CardContent>
    </Card>
  );
}
