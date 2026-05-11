import React, { useRef } from "react";
import { FiEdit3, FiTrash2, FiUpload } from "react-icons/fi";
import type { MutableRefObject } from "react";
import type { Coordinates } from "../../../types";
import {
  CONTENT,
  SECTION,
  SECTION_TITLE,
  BTN,
  BTN_SECONDARY,
} from "../panelStyles";

interface TabPathProps {
  mapServiceRef?: MutableRefObject<any>;
}

const normalizePoints = (raw: any): Array<Coordinates & { alt?: number }> => {
  if (!Array.isArray(raw)) return [];
  const points: Array<Coordinates & { alt?: number }> = [];
  raw.forEach((p) => {
    if (Array.isArray(p) && p.length >= 2) {
      const lng = Number(p[0]);
      const lat = Number(p[1]);
      const alt = p.length >= 3 ? Number(p[2]) : undefined;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      points.push({ lat, lng, alt: Number.isFinite(alt as number) ? (alt as number) : undefined });
      return;
    }
    if (p && typeof p === "object") {
      const lat = Number((p as any).lat ?? (p as any).latitude);
      const lng = Number((p as any).lng ?? (p as any).lon ?? (p as any).longitude);
      const alt = Number((p as any).alt ?? (p as any).altitude ?? (p as any).height);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      points.push({ lat, lng, alt: Number.isFinite(alt) ? alt : undefined });
    }
  });
  return points;
};

const normalizePaths = (raw: any): Array<{ id?: string; name?: string; points: Array<Coordinates & { alt?: number }> }> => {
  if (Array.isArray(raw)) {
    if (raw.length === 0) return [];
    const first = raw[0];
    const looksLikePathObject =
      first && typeof first === "object" && (
        Array.isArray(first.points) ||
        Array.isArray(first.path) ||
        Array.isArray(first.coordinates)
      );
    if (looksLikePathObject) {
      const paths: Array<{ id?: string; name?: string; points: Array<Coordinates & { alt?: number }> }> = [];
      raw.forEach((p) => {
        const pts = normalizePoints(p?.points ?? p?.path ?? p?.coordinates ?? []);
        if (pts.length >= 2) {
          paths.push({ id: p?.id, name: p?.name, points: pts });
        }
      });
      return paths;
    }
    const points = normalizePoints(raw);
    return points.length ? [{ points }] : [];
  }
  const fromObj = raw?.paths ?? raw?.routes ?? raw?.lines;
  if (Array.isArray(fromObj)) return normalizePaths(fromObj);
  const pts = normalizePoints(raw?.points ?? raw?.path ?? raw?.coordinates ?? []);
  return pts.length ? [{ points: pts }] : [];
};

export function TabPath({ mapServiceRef }: TabPathProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleJsonFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !mapServiceRef?.current) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const paths = normalizePaths(parsed);
      if (paths.length === 0) {
        console.warn("JSON must include at least one path with 2+ points.");
        return;
      }
      mapServiceRef.current.renderJsonPaths(paths);
    } catch (err) {
      console.error("Failed to parse JSON path file:", err);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleJsonFileChange}
      />
      <div className={CONTENT}>
        <div className={SECTION}>
          <div className={SECTION_TITLE}>Flight Path</div>
          <div className="space-y-2">
            <button className={`${BTN} ${BTN_SECONDARY} w-full`}>
              <FiEdit3 size={12} /> Draw Flight Path
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button className={`${BTN} ${BTN_SECONDARY}`}>Auto Path</button>
              <button className={`${BTN} ${BTN_SECONDARY}`}>
                <FiTrash2 size={12} /> Clear
              </button>
            </div>
            <button
              className={`${BTN} ${BTN_SECONDARY} w-full`}
              onClick={handleUploadClick}
            >
              <FiUpload size={12} /> Upload Path
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
