
export const MARKER_ICONS = [
    { code: 'E7BA', label: 'Warning', font: 'Segoe MDL2 Assets' },
    { code: 'E80F', label: 'Building', font: 'Segoe MDL2 Assets' },
    { code: 'E7E3', label: 'Ship', font: 'Segoe MDL2 Assets' },
    { code: 'E7C1', label: 'Flag', font: 'Segoe MDL2 Assets' },
    { code: 'E7C3', label: 'Target', font: 'Segoe MDL2 Assets' },
    { code: 'EC3E', label: 'Antenna', font: 'Segoe Fluent Icons' },
    { code: 'E709', label: 'Plane', font: 'Segoe MDL2 Assets' },
    { code: 'EC4A', label: 'Fuel', font: 'Segoe Fluent Icons' },
    { code: 'E72E', label: 'Shield', font: 'Segoe MDL2 Assets' },
    { code: 'E734', label: 'Diamond', font: 'Segoe MDL2 Assets' },
  ] as const;
  
  export type MarkerIconCode = typeof MARKER_ICONS[number]['code'];
  
  export function getMarkerIconChar(code: string): string {
    return String.fromCharCode(parseInt(code, 16));
  }
  
  const iconFont = (code: string) =>
    ['EC3E', 'EC4A'].includes(code) ? 'Segoe Fluent Icons' : 'Segoe MDL2 Assets';
  
  export function createMarkerIconImageData(code: string): { width: number; height: number; data: Uint8ClampedArray } {
    const size = 40;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { width: size, height: size, data: new Uint8ClampedArray(size * size * 4) };
    ctx.clearRect(0, 0, size, size);
    ctx.font = `28px "${iconFont(code)}", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1a1a1a';
    ctx.fillText(getMarkerIconChar(code), size / 2, size / 2);
    const imageData = ctx.getImageData(0, 0, size, size);
    return { width: imageData.width, height: imageData.height, data: imageData.data };
  }
  
  export function getMarkerIconImageId(code: string): string {
    return `marker-icon-${code}`;
  }
  
  