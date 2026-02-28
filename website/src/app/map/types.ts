export type MapCommand =
  | { type: "uniview:focus-lot"; lotId: string }
  | { type: "uniview:set-campus"; campusId: string }
  | { type: "uniview:reset-view" };

export interface LotMapBinding {
  lotId: string;
  mapLotId: string;
  status: "ready" | "planned";
}
