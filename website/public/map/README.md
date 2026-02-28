# UniView Map Data Structure

## Files
- `config/map-config.json`: master map configuration.
- `data/campuses/<campus-id>.geojson`: one campus boundary polygon per file.
- `data/lots/<lot-id>-boundary.geojson`: lot boundary polygon.
- `data/lots/<lot-id>-spots.geojson`: individual parking-space polygons.

## Drill-Down Model
1. Campus overlays are shown first.
2. Selecting a campus shows lot markers for that campus.
3. Selecting a lot shows lot boundary.
4. Clicking lot boundary reveals parking-space overlays.

## Add a New Campus
1. Add campus boundary GeoJSON file in `data/campuses/`.
2. Add campus entry in `config/map-config.json` under `campuses` with:
   - `id` matching app campus id
   - `name`
   - `paths.boundary`
   - `focusView`

## Add a New Lot Overlay
1. Add `boundary` and `spots` GeoJSON files in `data/lots/`.
2. Add lot entry in `config/map-config.json` under `lots` with:
   - `id` (map lot id)
   - `campusId`
   - `appLotId` (lot id from app data)
   - `previewPoint`
   - `focusView`
   - `paths.boundary` and `paths.spots`
   - `styles`
3. Add/confirm the lot mapping in `src/app/map/lotRegistry.ts`.
