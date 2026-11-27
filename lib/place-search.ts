import MiniSearch from "minisearch";

export interface WardZonePresence {
  zoneCode: string;
  zoneLabel: string;
}

export interface PlaceIndexEntry {
  id: string;
  name: string;
  kind: "locality" | "road" | "landmark" | "ward" | "corporation" | "place";
  categoryLabel: string;
  lat: number;
  lng: number;
  corporationId: string;
  corporationName: string;
  wardNumber: string | null;
  wardName: string | null;
  planningDistrict: string | null;
  zoneCode: string | null;
  zoneLabel: string | null;
  zonesPresent?: WardZonePresence[];
}

export interface PlaceIndexPayload {
  schema_version: string;
  generated_from: string;
  count: number;
  places: PlaceIndexEntry[];
}

export interface MapUrlHashState {
  lat: number;
  lng: number;
  zoom: number;
  place: string | null;
}

export function createPlaceMiniSearch(
  places: ReadonlyArray<PlaceIndexEntry>
): MiniSearch<PlaceIndexEntry> {
  const miniSearch = new MiniSearch<PlaceIndexEntry>({
    fields: [
      "name",
      "wardName",
      "wardNumber",
      "corporationName",
      "zoneLabel",
      "categoryLabel",
    ],
    storeFields: [
      "id",
      "name",
      "kind",
      "categoryLabel",
      "lat",
      "lng",
      "corporationId",
      "corporationName",
      "wardNumber",
      "wardName",
      "planningDistrict",
      "zoneCode",
      "zoneLabel",
      "zonesPresent",
    ],
    searchOptions: {
      fuzzy: 0.2,
      prefix: true,
      boost: {
        name: 4,
        wardName: 2,
        wardNumber: 2,
        zoneLabel: 1.5,
      },
    },
  });
  miniSearch.addAll([...places]);
  return miniSearch;
}

export function searchPlacesWithMiniSearch(
  miniSearch: MiniSearch<PlaceIndexEntry>,
  query: string,
  limit = 10
): PlaceIndexEntry[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const rawResults = miniSearch.search(trimmed);
  return rawResults.slice(0, limit).map((res) => ({
    id: String(res.id),
    name: String(res.name ?? ""),
    kind: (res.kind as PlaceIndexEntry["kind"]) ?? "place",
    categoryLabel: String(res.categoryLabel ?? "Place"),
    lat: Number(res.lat),
    lng: Number(res.lng),
    corporationId: String(res.corporationId ?? ""),
    corporationName: String(res.corporationName ?? ""),
    wardNumber: res.wardNumber ? String(res.wardNumber) : null,
    wardName: res.wardName ? String(res.wardName) : null,
    planningDistrict: res.planningDistrict ? String(res.planningDistrict) : null,
    zoneCode: res.zoneCode ? String(res.zoneCode) : null,
    zoneLabel: res.zoneLabel ? String(res.zoneLabel) : null,
    zonesPresent: Array.isArray(res.zonesPresent) ? res.zonesPresent : undefined,
  }));
}

export function parseMapUrlHash(rawHash: string): MapUrlHashState | null {
  const clean = rawHash.replace(/^#+/, "").trim();
  if (!clean) return null;
  const parts = clean.split(",");
  if (parts.length < 3) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  const zoom = Number(parts[2]);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    !Number.isFinite(zoom)
  ) {
    return null;
  }
  const rawPlace = parts.slice(3).join(",").trim();
  let place: string | null = null;
  if (rawPlace) {
    try {
      place = decodeURIComponent(rawPlace);
    } catch {
      place = rawPlace;
    }
  }
  return {
    lat,
    lng,
    zoom,
    place,
  };
}

export function formatMapUrlHash(state: MapUrlHashState): string {
  const latStr = state.lat.toFixed(4);
  const lngStr = state.lng.toFixed(4);
  const zoomStr = Number(state.zoom.toFixed(1)).toString();
  if (state.place && state.place.trim().length > 0) {
    return `#${latStr},${lngStr},${zoomStr},${encodeURIComponent(state.place.trim())}`;
  }
  return `#${latStr},${lngStr},${zoomStr}`;
}
