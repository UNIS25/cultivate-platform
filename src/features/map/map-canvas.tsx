"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";

export type MapPointKind = "initiative" | "donor" | "recipient" | "surplus";

export interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  kind: MapPointKind;
  label: string;
}

type LeafletModule = typeof import("leaflet");

const markerLabels: Record<MapPointKind, string> = {
  initiative: "I",
  donor: "D",
  recipient: "R",
  surplus: "S",
};

const markerAnchors: Record<MapPointKind, [number, number]> = {
  initiative: [17, 17],
  donor: [32, 17],
  recipient: [2, 17],
  surplus: [17, 32],
};

function syncMarkers(
  leaflet: LeafletModule,
  map: LeafletMap,
  currentMarkers: Marker[],
  points: MapPoint[],
  selectedId: string | undefined,
  onSelect: ((point: MapPoint) => void) | undefined,
) {
  currentMarkers.forEach((marker) => marker.remove());

  return points.map((point) => {
    const selectedClass = point.id === selectedId ? " leaflet-entity-marker-selected" : "";
    const icon = leaflet.divIcon({
      className: "leaflet-entity-icon",
      html: `<span class="leaflet-entity-marker leaflet-marker-${point.kind}${selectedClass}"><span>${markerLabels[point.kind]}</span></span>`,
      iconSize: [34, 34],
      iconAnchor: markerAnchors[point.kind],
      tooltipAnchor: [0, -18],
    });

    const marker = leaflet.marker([point.latitude, point.longitude], {
      icon,
      keyboard: true,
      title: point.label,
      alt: point.label,
      riseOnHover: true,
    });

    marker.bindTooltip(point.label, { direction: "top", opacity: 0.96 });
    marker.on("click", () => onSelect?.(point));
    return marker.addTo(map);
  });
}

export function MapCanvas({
  points,
  selectedId,
  onSelect,
  compact = false,
}: {
  points: MapPoint[];
  selectedId?: string;
  onSelect?: (point: MapPoint) => void;
  compact?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const latestPropsRef = useRef({ points, selectedId, onSelect });

  useEffect(() => {
    latestPropsRef.current = { points, selectedId, onSelect };
  }, [onSelect, points, selectedId]);

  useEffect(() => {
    let cancelled = false;

    void import("leaflet").then((leaflet) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = leaflet.map(containerRef.current, {
        center: [50.9, 7.2],
        zoom: compact ? 3 : 4,
        minZoom: 2,
        zoomControl: !compact,
        attributionControl: true,
      });

      leaflet.tileLayer(
        process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        },
      ).addTo(map);

      if (!compact) leaflet.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);

      leafletRef.current = leaflet;
      mapRef.current = map;
      const latest = latestPropsRef.current;
      markersRef.current = syncMarkers(leaflet, map, [], latest.points, latest.selectedId, latest.onSelect);

      window.setTimeout(() => map.invalidateSize(), 0);
    });

    return () => {
      cancelled = true;
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
    };
  }, [compact]);

  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    if (!leaflet || !map) return;
    markersRef.current = syncMarkers(leaflet, map, markersRef.current, points, selectedId, onSelect);
  }, [onSelect, points, selectedId]);

  useEffect(() => {
    const point = points.find((item) => item.id === selectedId);
    if (!point || !mapRef.current) return;
    mapRef.current.flyTo([point.latitude, point.longitude], 10, { duration: 0.7 });
  }, [points, selectedId]);

  return <div ref={containerRef} className="h-full w-full bg-[#dce5df]" aria-label="Leaflet food sharing locations map" />;
}
