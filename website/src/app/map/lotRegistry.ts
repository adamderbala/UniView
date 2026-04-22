import type { LotMapBinding } from "./types";

// Expand this registry as new lot overlays are added to public/map/data/lots.
export const lotMapBindings: LotMapBinding[] = [
  {
    lotId: "core_building",
    mapLotId: "demo-spots",
    status: "ready",
  },
  {
    lotId: "stadium_west",
    mapLotId: "stadium-west",
    status: "ready",
  },
  {
    lotId: "jerseymikes",
    mapLotId: "jerseymikes",
    status: "ready",
  },
  {
    lotId: "yellow_lot",
    mapLotId: "yellowlot",
    status: "ready",
  },
  {
    lotId: "green_lot",
    mapLotId: "greenlot",
    status: "ready",
  },
  {
    lotId: "lot_105",
    mapLotId: "lot105",
    status: "ready",
  },
  {
    lotId: "lot_101",
    mapLotId: "lot101",
    status: "ready",
  },
  {
    lotId: "lot_102",
    mapLotId: "lot102",
    status: "ready",
  },
  {
    lotId: "lot_103",
    mapLotId: "lot103",
    status: "ready",
  },
];

const bindingMap = new Map(lotMapBindings.map((binding) => [binding.lotId, binding]));
const reverseBindingMap = new Map(lotMapBindings.map((binding) => [binding.mapLotId, binding.lotId]));

export const getMapBindingForLot = (lotId: string) => bindingMap.get(lotId);
export const getLotIdForMapLot = (mapLotId: string) => reverseBindingMap.get(mapLotId);
