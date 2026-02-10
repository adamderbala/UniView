import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Slider } from "./ui/slider";
import { Settings as SettingsIcon } from "lucide-react";
import type { UserPreferences } from "../types/parking";


interface SettingsDialogProps {
  preferences: UserPreferences;
  onUpdatePreferences: (preferences: UserPreferences) => void;
}

export function SettingsDialog({ preferences, onUpdatePreferences }: SettingsDialogProps) {
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const handleSave = () => {
    onUpdatePreferences(localPreferences);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your UniView experience
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="notifications" className="flex flex-col space-y-1">
              <span>Enable Notifications</span>
              <span className="text-xs text-muted-foreground font-normal">
                Get alerts when saved lots have availability
              </span>
            </Label>
            <Switch
              id="notifications"
              checked={localPreferences.notificationsEnabled}
              onCheckedChange={(checked) =>
                setLocalPreferences({ ...localPreferences, notificationsEnabled: checked })
              }
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="threshold" className="flex flex-col space-y-1">
              <span>Alert Threshold</span>
              <span className="text-xs text-muted-foreground font-normal">
                Notify when occupancy drops below {localPreferences.alertThreshold}%
              </span>
            </Label>
            <Slider
              id="threshold"
              min={10}
              max={90}
              step={5}
              value={[localPreferences.alertThreshold]}
              onValueChange={([value]) =>
                setLocalPreferences({ ...localPreferences, alertThreshold: value })
              }
              disabled={!localPreferences.notificationsEnabled}
            />
            <div className="text-center text-sm font-medium">
              {localPreferences.alertThreshold}%
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <DialogTrigger asChild>
            <Button variant="outline">Cancel</Button>
          </DialogTrigger>
          <DialogTrigger asChild>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogTrigger>
        </div>
      </DialogContent>
    </Dialog>
  );
}
