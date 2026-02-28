import type { LotMapBinding } from "./types";

// Expand this registry as new lot overlays are added to public/map/data/lots.
export const lotMapBindings: LotMapBinding[] = [
  {
    lotId: "lot-busch-stadium-west",
    mapLotId: "stadium-west",
    status: "ready",
  },
  {
    lotId: "lot-liv-yellow",
    mapLotId: "yellowlot",
    status: "ready",
  },
  {
    lotId: "lot-liv-green",
    mapLotId: "greenlot",
    status: "ready",
  },
  {
    lotId: "lot-liv-105",
    mapLotId: "lot105",
    status: "ready",
  },
  {
    lotId: "lot-liv-101",
    mapLotId: "lot101",
    status: "ready",
  },
  {
    lotId: "lot-liv-102",
    mapLotId: "lot102",
    status: "ready",
  },
  {
    lotId: "lot-liv-103",
    mapLotId: "lot103",
    status: "ready",
  },
];

const bindingMap = new Map(lotMapBindings.map((binding) => [binding.lotId, binding]));
const reverseBindingMap = new Map(lotMapBindings.map((binding) => [binding.mapLotId, binding.lotId]));

export const getMapBindingForLot = (lotId: string) => bindingMap.get(lotId);
export const getLotIdForMapLot = (mapLotId: string) => reverseBindingMap.get(mapLotId);
