import type { StyleSpecification } from "maplibre-gl";

/**
 * Protomaps Light MapLibre GL Style Specification v8 over a PMTiles source (Part 5).
 *
 * Keeps a top symbol anchor layer (`protomaps-labels-anchor`) so project GeoJSON
 * layers (`zones.geojson`, `wards.geojson`, `boundary.geojson`) are inserted
 * beneath street and place labels.
 */
export function buildProtomapsLightStyle(
  pmtilesUrl: string
): StyleSpecification {
  const sourceUrl = pmtilesUrl.startsWith("pmtiles://")
    ? pmtilesUrl
    : `pmtiles://${pmtilesUrl}`;

  return {
    version: 8,
    sources: {
      protomaps: {
        type: "vector",
        url: sourceUrl,
        attribution: "© OpenStreetMap contributors · Protomaps",
      },
    },
    layers: [
      {
        id: "bg-paper",
        type: "background",
        paint: {
          "background-color": "#f8f8f6",
        },
      },
      {
        id: "earth-fill",
        type: "fill",
        source: "protomaps",
        "source-layer": "earth",
        paint: {
          "fill-color": "#f8f8f6",
        },
      },
      {
        id: "landuse-park",
        type: "fill",
        source: "protomaps",
        "source-layer": "landuse",
        filter: [
          "in",
          ["get", "kind"],
          [
            "literal",
            [
              "park",
              "nature_reserve",
              "forest",
              "garden",
              "pitch",
              "cemetery",
              "grass",
            ],
          ],
        ],
        paint: {
          "fill-color": "#d8e8c8",
          "fill-opacity": 0.85,
        },
      },
      {
        id: "water-fill",
        type: "fill",
        source: "protomaps",
        "source-layer": "water",
        paint: {
          "fill-color": "#a0c8f0",
        },
      },
      {
        id: "water-line",
        type: "line",
        source: "protomaps",
        "source-layer": "water",
        paint: {
          "line-color": "#7ab0e0",
          "line-width": 1.1,
        },
      },
      {
        id: "buildings-fill",
        type: "fill",
        source: "protomaps",
        "source-layer": "buildings",
        minzoom: 13,
        paint: {
          "fill-color": "#eae6df",
          "fill-outline-color": "#d8d2c7",
          "fill-opacity": 0.8,
        },
      },
      {
        id: "roads-minor",
        type: "line",
        source: "protomaps",
        "source-layer": "roads",
        filter: [
          "in",
          ["get", "kind"],
          ["literal", ["minor_road", "other", "path"]],
        ],
        paint: {
          "line-color": "#ffffff",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            0.7,
            14,
            1.8,
            16,
            3.2,
          ],
        },
      },
      {
        id: "roads-medium",
        type: "line",
        source: "protomaps",
        "source-layer": "roads",
        filter: ["==", ["get", "kind"], "medium_road"],
        paint: {
          "line-color": "#fce8b2",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            9,
            1.0,
            14,
            2.4,
            16,
            4.2,
          ],
        },
      },
      {
        id: "roads-major",
        type: "line",
        source: "protomaps",
        "source-layer": "roads",
        filter: [
          "in",
          ["get", "kind"],
          ["literal", ["highway", "major_road"]],
        ],
        paint: {
          "line-color": "#f7b267",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            8,
            1.4,
            13,
            2.8,
            16,
            5.0,
          ],
        },
      },
      {
        id: "roads-rail-metro",
        type: "line",
        source: "protomaps",
        "source-layer": "roads",
        filter: ["==", ["get", "kind"], "rail"],
        paint: {
          "line-color": "#6b5b95",
          "line-dasharray": [3, 2],
          "line-width": 1.6,
        },
      },
      {
        id: "admin-boundaries",
        type: "line",
        source: "protomaps",
        "source-layer": "boundaries",
        paint: {
          "line-color": "#8e8a82",
          "line-dasharray": [3, 2],
          "line-width": 1,
        },
      },
      {
        id: "protomaps-labels-anchor",
        type: "line",
        source: "protomaps",
        "source-layer": "roads",
        filter: [
          "in",
          ["get", "kind"],
          ["literal", ["highway", "major_road"]],
        ],
        paint: {
          "line-color": "#2b2b2b",
          "line-opacity": 0.35,
          "line-width": 0.6,
        },
      },
    ],
  };
}

export const buildDg2nMapStyle = buildProtomapsLightStyle;
