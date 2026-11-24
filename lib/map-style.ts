import type { StyleSpecification } from "maplibre-gl";

/**
 * Build a monochrome dg2n MapLibre GL Style Specification v8 over a PMTiles source.
 *
 * Palette:
 * - --paper: #f5f3ed (land / background)
 * - --panel: #efeee8 (parks / green space)
 * - water:   #e2e0d8 (monochrome water wash)
 * - --hairline: #c8ccc0 (minor roads / building outlines)
 * - --muted: #5b5e56 (medium roads / labels)
 * - --ink:   #080909 (major roads / boundaries)
 */
export function buildDg2nMapStyle(pmtilesUrl: string): StyleSpecification {
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
          "background-color": "#f5f3ed",
        },
      },
      {
        id: "earth-fill",
        type: "fill",
        source: "protomaps",
        "source-layer": "earth",
        paint: {
          "fill-color": "#f5f3ed",
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
          ["literal", ["park", "nature_reserve", "forest", "garden", "pitch", "cemetery"]],
        ],
        paint: {
          "fill-color": "#efeee8",
          "fill-opacity": 0.9,
        },
      },
      {
        id: "water-fill",
        type: "fill",
        source: "protomaps",
        "source-layer": "water",
        paint: {
          "fill-color": "#e2e0d8",
        },
      },
      {
        id: "water-line",
        type: "line",
        source: "protomaps",
        "source-layer": "water",
        paint: {
          "line-color": "#c8ccc0",
          "line-width": 1,
        },
      },
      {
        id: "buildings-fill",
        type: "fill",
        source: "protomaps",
        "source-layer": "buildings",
        minzoom: 13,
        paint: {
          "fill-color": "#ebe9e1",
          "fill-outline-color": "#d5d7cd",
          "fill-opacity": 0.85,
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
          "line-color": "#c8ccc0",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            0.5,
            14,
            1.4,
            16,
            2.5,
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
          "line-color": "#5b5e56",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            9,
            0.8,
            14,
            2.0,
            16,
            3.5,
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
          "line-color": "#080909",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            8,
            1.1,
            13,
            2.4,
            16,
            4.2,
          ],
        },
      },
      {
        id: "admin-boundaries",
        type: "line",
        source: "protomaps",
        "source-layer": "boundaries",
        paint: {
          "line-color": "#5b5e56",
          "line-dasharray": [3, 2],
          "line-width": 1,
        },
      },
    ],
  };
}
