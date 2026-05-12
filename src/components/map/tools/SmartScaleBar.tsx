// FixedScaleBar.tsx
import React, { useEffect, useState } from "react";
import type { Map as MLMap, PointLike } from "maplibre-gl";

type Props = { map: any; widthPx?: number };

export default function SmartScaleBar({ map, widthPx = 200 }: Props) {
  const [label, setLabel] = useState("…");

  useEffect(() => {
    if (!map) return;

    const update = () => {
      const centerPx = map.project(map.getCenter());
      const p1 = map.unproject([centerPx.x, centerPx.y] as PointLike);
      const p2 = map.unproject([centerPx.x + widthPx, centerPx.y] as PointLike);
      const km = distanceKm({ lng: p1.lng, lat: p1.lat }, { lng: p2.lng, lat: p2.lat });
      setLabel(formatKm(km));
    };

    update();
    map.on("move", update);
    map.on("zoom", update);
    map.on("resize", update);
    return () => {
      map.off("move", update);
      map.off("zoom", update);
      map.off("resize", update);
    };
  }, [map, widthPx]);

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: 16,
        transform: "translateX(-50%)",
        background: "rgba(255,255,255,0.9)",
        border: "1px solid #ccc",
        borderRadius: 6,
        padding: "6px 10px",
        fontSize: 13,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          width: widthPx,
          height: 6,
          background: "#111827",
          marginBottom: 4,
        }}
      />
      <div style={{ textAlign: "center" }}>{label}</div>
    </div>
  );
}

function distanceKm(a: { lng: number; lat: number }, b: { lng: number; lat: number }) {
  const R = 6371; // ק״מ
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function formatKm(km: number) {
  return km >= 1 ? `${km.toFixed(2)} km` : `${Math.round(km * 1000)} m`;
}