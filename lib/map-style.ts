import type { LayerSpecification, StyleSpecification } from "maplibre-gl";
import { layers as protomapsLayers, namedFlavor } from "@protomaps/basemaps";

/**
 * Protomaps `light` flavor MapLibre GL Style Specification v8 over a PMTiles source (Part 2.1 & 2.2).
 *
 * Uses `@protomaps/basemaps` (`light` flavor) with self-hosted glyph fonts
 * (`/fonts/{fontstack}/{range}.pbf`) and sprites (`/sprites/light`), and separates:
 * - Layer 1 (bottom): Base map without labels (all non-symbol layers)
 * - Anchor layer (`protomaps-labels-anchor`): insertion point for Layers 2–7
 *   (land-use zones, uncovered hatch, planning districts, wards, corporations, derived overlays)
 * - Layer 8 (top): Base map labels on top (all symbol layers)
 */
export function buildProtomapsLightStyle(
  pmtilesUrl: string,
  assetOrigin = ""
): StyleSpecification {
  const sourceUrl = pmtilesUrl.startsWith("pmtiles://")
    ? pmtilesUrl
    : `pmtiles://${pmtilesUrl}`;
  const originPrefix =
    assetOrigin ||
    (typeof window !== "undefined" ? window.location.origin : "");

  const allFlavorLayers = protomapsLayers(
    "protomaps",
    namedFlavor("light"),
    { lang: "en" }
  ) as unknown as LayerSpecification[];

  const nonSymbolLayers = allFlavorLayers.filter((l) => l.type !== "symbol");
  const symbolLayers = allFlavorLayers.filter((l) => l.type === "symbol");

  const labelsAnchorLayer: LayerSpecification = {
    id: "protomaps-labels-anchor",
    type: "background",
    paint: {
      "background-color": "#000000",
      "background-opacity": 0,
    },
  };

  return {
    version: 8,
    glyphs: `${originPrefix}/fonts/{fontstack}/{range}.pbf`,
    sprite: `${originPrefix}/sprites/light`,
    sources: {
      protomaps: {
        type: "vector",
        url: sourceUrl,
        attribution: "Protomaps © OpenStreetMap",
      },
    },
    layers: [...nonSymbolLayers, labelsAnchorLayer, ...symbolLayers],
  };
}

export const buildDg2nMapStyle = buildProtomapsLightStyle;
