/**
 * מפת בדיקה – טעינה מהרשת בלבד, בלי שרת מקומי.
 * כל סוגי המפה משתמשים ב-OpenStreetMap (רסטר) + גופנים מ-MapLibre demotiles.
 */
const PUBLIC_RASTER_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const PUBLIC_GLYPHS = 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf';

export function getMapStyle(_mapType: string, _type: 'vector' | 'raster'): any {
    // כולם – רסטר OSM מהרשת (ללא שרת מקומי)
    return {
        version: 8,
        glyphs: PUBLIC_GLYPHS,
        sources: {
            rastertiles: {
                type: 'raster',
                tiles: [PUBLIC_RASTER_TILES],
                tileSize: 256,
                minzoom: 0,
                maxzoom: 19
            }
        },
        layers: [
            {
                id: 'raster-layer',
                type: 'raster',
                source: 'rastertiles'
            }
        ]
    };
}