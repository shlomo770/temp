import { useAppSelector } from "../../../hooks/useAppSelector";
import { useMemo } from "react";
import { useSelector } from "react-redux";

type CompassState = {
    vehicleHeading: number;
    viewCenter: number;
    viewFov: number;
    turretAzimuth: number;
    targetBearing: number;
};

const initialState: CompassState = {
    vehicleHeading: 0,
    viewCenter: 0,
    viewFov: 0,
    turretAzimuth: 0,
    targetBearing: 0,
};

const selectCompass = (s: any): CompassState => s.tacticalCompass ?? initialState;
const normDeg = (d: number) => {
    let x = d % 360;
    if (x < 0) x += 360;
    return x;
};

const polarToXY = (deg: number, radius: number, cx: number, cy: number) => {
    const r = (normDeg(deg) * Math.PI) / 180;
    return {
        x: cx + Math.sin(r) * radius,
        y: cy - Math.cos(r) * radius,
    }
};

const sectorPath = (
    cx: number,
    cy: number,
    rOuter: number,
    rInner: number,
    startDeg: number,
    endDeg: number
) => {
    const s = normDeg(startDeg);
    const safeEndDeg = Math.min(endDeg, 359.999);
    const span = (normDeg(safeEndDeg) - s + 360) % 360;
    const largeArc = span > 180 ? 1 : 0;
    const p1 = polarToXY(s, rOuter, cx, cy);
    const p2 = polarToXY(s + span, rOuter, cx, cy);
    const p3 = polarToXY(s + span, rInner, cx, cy);
    const p4 = polarToXY(s, rInner, cx, cy);
    if (span === 0) return '';
    return [
        `M ${p1.x} ${p1.y}`,
        `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
        `L ${p3.x} ${p3.y}`,
        `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
        "Z",
    ].join(" ");
};

const dashedLineDots = (x1: number, y1: number, x2: number, y2: number, spacing: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;
    const count = Math.floor(len / spacing);
    const pts = [];
    if (len < 0.001) return [];
    for (let i = 1; i <= count; i++) {
        pts.push({ x: x1 + ux * spacing * i, y: y1 + uy * spacing * i });
    }
    return pts;
};

const TacticalCompassWidget = () => {
    const myPosition = useAppSelector(s => s.myPosition);
    const radarState = useAppSelector(state => state.radar.radarNonCoverage);
    type DegRange = [number, number];
    const ranges = useMemo<DegRange[]>(() => {
        if (!Array.isArray(radarState)) return [];
        return radarState
            .map(s => {
                const m = s.match(/^(\d+)\s*-\s*(\d+)$/);
                if (!m) return null;

                const from = Number(m[1]);
                const to = Math.min(Number(m[2]), 359);

                return Number.isFinite(from) && Number.isFinite(to)
                    ? ([from, to] as DegRange)
                    : null;
            })
            .filter((v): v is DegRange => v !== null);
    }, [radarState]);
    const {
        turretAzimuth,
        targetBearing,
    } = useSelector(selectCompass);
    const size = 180;
    const cx = size / 2;
    const cy = size / 2;
    const ringR = 45;
    const wedgeOuter = 43;
    const wedgeInner = 11;
    const turretLen = 43;
    const targetR = 43;
    const tickSize = 9;
    const labelOffset = 15;
    const turretEnd = polarToXY(turretAzimuth, turretLen, cx, cy);
    const targetPos = polarToXY(targetBearing, targetR, cx, cy);
    const dotPts = useMemo(
        () => dashedLineDots(cx, cy, turretEnd.x, turretEnd.y, 14),
        [cx, cy, turretEnd.x, turretEnd.y]
    );
    return (
        <div className="fixed bottom-4 right-4 z-[9999] bg-[#1f2937d6] pointer-events-none rounded-full border border-white border-2">
            <div className="">
                <svg width={size} height={size} className="block">
                    <circle cx={cx} cy={cy} r={ringR} fill="none" stroke="white" strokeWidth={6} />
                    <g fill="white">
                        <path d={`M ${cx} ${cy - ringR - tickSize} L ${cx - tickSize} ${cy - ringR + 0} L ${cx + tickSize} ${cy - ringR + 0} Z`} />
                        <path d={`M ${cx + ringR + tickSize} ${cy} L ${cx + ringR - 0} ${cy - tickSize} L ${cx + ringR - 0} ${cy + tickSize} Z`} />
                        <path d={`M ${cx} ${cy + ringR + tickSize} L ${cx - tickSize} ${cy + ringR - 0} L ${cx + tickSize} ${cy + ringR - 0} Z`} />
                        <path d={`M ${cx - ringR - tickSize} ${cy} L ${cx - ringR + 0} ${cy - tickSize} L ${cx - ringR + 0} ${cy + tickSize} Z`} />
                    </g>
                    <g fill="white" fontSize="11" fontFamily="ui-sans-serif, system-ui" fontWeight="600">
                        <text x={cx} y={cy - ringR - labelOffset} textAnchor="middle">N</text>
                        <text x={cx + ringR + labelOffset + 2} y={cy + 3} textAnchor="middle">E</text>
                        <text x={cx} y={cy + ringR + labelOffset + 2} textAnchor="middle">S</text>
                        <text x={cx - ringR - labelOffset - 2} y={cy + 3} textAnchor="middle">W</text>
                    </g>
                    {ranges.map(([from, to], i) => (
                        <path
                            key={i}
                            d={sectorPath(cx, cy, wedgeOuter, wedgeInner, from, to === 360 ? 359 : to)}
                            fill="rgba(220,38,38,0.85)" />
                    ))}
                    <g>
                        {dotPts.map((p, i) => (
                            <circle key={i} cx={p.x} cy={p.y} r={2.6} fill="white" opacity={0.9} />
                        ))}
                    </g>
                    <g transform={`translate(${targetPos.x}, ${targetPos.y})`}>
                        <circle r={8} fill="white" opacity={0.95} />
                        <circle r={4} fill="purple" opacity={0.9} />
                    </g>
                    <g transform={`translate(${cx}, ${cy}) rotate(${myPosition.heading})`}>
                        <image
                            href="/icons/VehicleTopIcon.png" x={-17} y={-17} width={34} height={34} opacity={1} style={{ imageRendering: "auto" }} />
                        <path d="M 0 -9 L -6 3 L 6 3 Z" fill="lightGray" opacity={0.95} transform="translate(0,-23)" />
                    </g>
                    <g fill="white" fontFamily="ui-sans-serif, system-ui" fontWeight="400" transform="translate(0,10)">
                        <text x={cx} y={size - 10} textAnchor="middle" fontSize="15">
                            {Math.round(Number(myPosition.heading))}°
                        </text>
                    </g>
                </svg>
            </div>
        </div>
    );
}
export default TacticalCompassWidget;