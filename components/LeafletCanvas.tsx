"use client";

import React from "react";
import { GeoJSON, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import type { GenericFeatureCollection, ZoneFeature } from "@/lib/data";

interface LeafletCanvasProps {
  zones: ZoneFeature[];
  boundary?: GenericFeatureCollection | null;
  overlays?: GenericFeatureCollection | null;
  selectedZoneCode: string | null;
  onSelectZone: (zoneCode: string) => void;
  center: [number, number];
  zoom?: number;
}

export default function LeafletCanvas({
  zones,
  boundary,
  overlays,
  selectedZoneCode,
  onSelectZone,
  center,
  zoom = 12,
}: LeafletCanvasProps) {
  const zonesCollection = {
    type: "FeatureCollection" as const,
    features: zones,
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ width: "100%", height: "100%", minHeight: "420px" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors (ODbL)'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {boundary && boundary.features.length > 0 && (
        <GeoJSON
          data={boundary as unknown as GeoJSON.GeoJsonObject}
          style={() => ({
            color: "#080909",
            weight: 2,
            fillOpacity: 0,
            dashArray: "6 4",
          })}
        />
      )}
      <GeoJSON
        key={`zones-${selectedZoneCode ?? "none"}`}
        data={zonesCollection as unknown as GeoJSON.GeoJsonObject}
        style={(feature) => {
          const code = String(feature?.properties?.zone_code ?? "");
          const isSelected = selectedZoneCode === code;
          return {
            color: isSelected ? "#ff6b52" : "#080909",
            weight: isSelected ? 2.4 : 1,
            fillColor: isSelected ? "#ff6b52" : "#5b5e56",
            fillOpacity: isSelected ? 0.28 : 0.12,
          };
        }}
        onEachFeature={(feature, layer) => {
          const code = String(feature.properties?.zone_code ?? "");
          const label = String(feature.properties?.zone_label ?? code);
          layer.on({
            click: () => onSelectZone(code),
          });
          layer.bindTooltip(`${code} · ${label}`, {
            permanent: true,
            direction: "center",
            className: "dg-mono",
          });
        }}
      />
      {overlays && overlays.features.length > 0 && (
        <GeoJSON
          data={overlays as unknown as GeoJSON.GeoJsonObject}
          style={() => ({
            color: "#080909",
            weight: 2,
            dashArray: "3 3",
            fillColor: "#080909",
            fillOpacity: 0.18,
          })}
        >
          <Tooltip sticky>Derived Overlay (Approximate)</Tooltip>
        </GeoJSON>
      )}
    </MapContainer>
  );
}
