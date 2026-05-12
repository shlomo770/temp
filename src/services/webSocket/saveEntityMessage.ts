import { EntityCategoryEnum, EntityTypeEnum } from "../../enums/entitis.enum";
import type { EntityType, Coordinates } from "../../types";
import { calculateDistance, metersPerDegree } from "../../utils/geometry";
import { closePolygonCoordinates } from "../entities/EntityGeometryService";

export type SaveEntityType = "LINE" | "ELLIPSE" | "SECTOR" | "POLYGON";

export const toServerEntityCategory = (category: EntityCategoryEnum): EntityCategoryEnum => {
    if (category === EntityCategoryEnum.WCO_FREE) return EntityCategoryEnum.WCO_FREE;
    if (category === EntityCategoryEnum.WCO_HOLD) return EntityCategoryEnum.WCO_HOLD;
    if (category === EntityCategoryEnum.FIZ) return EntityCategoryEnum.FIZ;
    return EntityCategoryEnum.FREE;
};

export const toLocalEntityCategory = (category: EntityCategoryEnum): EntityCategoryEnum => {
    const normalized = category;
    if (normalized === EntityCategoryEnum.WCO_FREE) return EntityCategoryEnum.WCO_FREE;
    if (normalized === EntityCategoryEnum.WCO_HOLD) return EntityCategoryEnum.WCO_HOLD;
    if (normalized === EntityCategoryEnum.FIZ) return EntityCategoryEnum.FIZ;
    return EntityCategoryEnum.FREE;
};

export const toServerEntityType = (type: EntityType): SaveEntityType | null => {
    if (type === "line") return "LINE";
    if (type === "ellipse") return "ELLIPSE";
    if (type === "sector") return "SECTOR";
    if (type === "polygon") return "POLYGON";
    // Server protocol has no CIRCLE enum; map circle to ellipse representation.
    if (type === "circle") return "ELLIPSE";
    return null;
};

export const toLocalEntityType = (type: string): EntityType | null => {
    const normalized = String(type || "").trim().toUpperCase();
    if (normalized === "LINE") return "line";
    if (normalized === "ELLIPSE") return "ellipse";
    if (normalized === "SECTOR") return "sector";
    if (normalized === "POLYGON") return "polygon";
    if (normalized === "RECTANGLE") return "rectangle";
    if (normalized === "CIRCLE") return "circle";
    if (normalized === "MARKER" || normalized === "POINT") return "marker";
    return null;
};

export const normalizeCoordinates = (coordinates: unknown): Coordinates[] => {
    if (!Array.isArray(coordinates)) return [];
    const out: Coordinates[] = [];
    for (const c of coordinates as any[]) {
        if (Array.isArray(c) && c.length >= 2) {
            const lng = Number(c[0]);
            const lat = Number(c[1]);
            const altRaw = Number(c[2]);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
            out.push({
                lat,
                lng,
                alt: Number.isFinite(altRaw) ? altRaw : undefined,
            });
            continue;
        }
        if (!c || typeof c !== "object") continue;
        const lat = Number((c as any).lat);
        const lng = Number((c as any).lng);
        const altRaw = Number((c as any).alt);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        out.push({
            lat,
            lng,
            alt: Number.isFinite(altRaw) ? altRaw : undefined,
        });
    }
    return out;
};

export type SaveEntityPayload = {
    name: string;
    temp_id: string;
    category: EntityCategoryEnum;
    type: any;
    coordinates: Coordinates[];
    alt?: number;
    params?: {
        lat?: number;
        lng?: number;
        radius_1?: number;
        radius_2?: number;
    };
};

export type UpdateEntityPayload = {
    id: string;
    category: EntityCategoryEnum;
    type: any;
    coordinates: Coordinates[];
    alt?: number;
    params?: {
        lat?: number;
        lng?: number;
        radius_1?: number;
        radius_2?: number;
    };
};

export const buildSaveEntityPayload = (
    id: string,
    localCategory: EntityCategoryEnum,
    localType: EntityType,
    coordinates: Coordinates[],
    name: string
): SaveEntityPayload | null => {
    const serverType = toServerEntityType(localType);
    if (!serverType || !Array.isArray(coordinates) || coordinates.length === 0) return null;
    const center = coordinates[0];
    const firstValidAlt = coordinates
        .map((c) => Number(c?.alt))
        .find((v) => Number.isFinite(v));
    const centerAlt = Number.isFinite(Number(center?.alt)) ? Number(center.alt) : firstValidAlt;
    const fallbackAlt = Number.isFinite(Number(centerAlt)) ? Number(centerAlt) : 0;
    const normalizedCoordinates: Coordinates[] = coordinates.map((c) => {
        const pointAlt = Number.isFinite(Number(c?.alt)) ? Number(c.alt) : fallbackAlt;
        return {
            lat: c.lat,
            lng: c.lng,
            alt: pointAlt,
        };
    });
    const alt = fallbackAlt;
    const payload: SaveEntityPayload = {
        temp_id: id,
        category: toServerEntityCategory(localCategory),
        type: serverType,
        coordinates: localType === 'polygon' ? closePolygonCoordinates(normalizedCoordinates) : normalizedCoordinates,
        alt,
        params: {},
        name
    };
    if (localType === "circle" && coordinates.length >= 2) {
        const edge = coordinates[1];
        const radius = calculateDistance(center, edge);
        payload.coordinates = [center];
        payload.params = {
            lat: center.lat,
            lng: center.lng,
            radius_1: radius,
            radius_2: radius,
        };
        return payload;
    }
    if (localType === "ellipse" && coordinates.length >= 2) {
        const edge = coordinates[1];
        const { mPerDegLat, mPerDegLng } = metersPerDegree(center.lat);
        const radius1 = Math.abs(edge.lng - center.lng) * mPerDegLng;
        const radius2 = Math.abs(edge.lat - center.lat) * mPerDegLat;
        payload.coordinates = [center];
        payload.params = {
            lat: center.lat,
            lng: center.lng,
            radius_1: Number.isFinite(radius1) ? radius1 : 0,
            radius_2: Number.isFinite(radius2) ? radius2 : 0,
        };
        return payload;
    }
    return payload;
};

export function toEntityCategoryEnum(
    value: string | null | undefined
): EntityTypeEnum {
    const normalized = String(value || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_");
    switch (normalized) {
        case "ELLIPSE":
            return EntityTypeEnum.ELLIPSE;

        case "POLYGON":
            return EntityTypeEnum.POLYGON;

        case "LINE":
            return EntityTypeEnum.POLYLINE;

        default:
            return EntityTypeEnum.POLYGON;
    }
}


export const buildUpdateEntityPayload = (
    id: string,
    localCategory: EntityCategoryEnum,
    localType: EntityType,
    coordinates: Coordinates[],
    name: string
): UpdateEntityPayload | null => {
    const savePayload = buildSaveEntityPayload(id, localCategory, localType, coordinates, name);
    if (!savePayload) return null;
    const { temp_id, ...rest } = savePayload;
    return {
        id: temp_id,
        ...rest,
    };
};

export const buildCircleCoordinatesFromPointRadius = (
    point: { lat: number; lng: number; alt?: number },
    radiusMeters: number
): Coordinates[] => {
    const { mPerDegLng } = metersPerDegree(point.lat);
    const edgeLng = point.lng + radiusMeters / mPerDegLng;
    return [
        { lat: point.lat, lng: point.lng, alt: point.alt },
        { lat: point.lat, lng: edgeLng, alt: point.alt },
    ];
};

export const buildEllipseCoordinatesFromCenterRadii = (
    point: { lat: number; lng: number; alt?: number },
    radius1Meters: number,
    radius2Meters: number
): Coordinates[] => {
    const { mPerDegLat, mPerDegLng } = metersPerDegree(point.lat);
    const edgeLng = point.lng + radius1Meters / mPerDegLng;
    const edgeLat = point.lat + radius2Meters / mPerDegLat;
    return [
        { lat: point.lat, lng: point.lng, alt: point.alt },
        { lat: edgeLat, lng: edgeLng, alt: point.alt },
    ];
};
