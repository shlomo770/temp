import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ToggleSwitch from "../ui/ToggleSwitch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useCoordinateFormat } from "../../hooks/useCoordinateFormat";
import { updateMyCoordinates } from "../../store/slices/myPositionSlice";
import { InsStatusE } from "../../enums/statusBar.enum";

/** שורת נתון בעברית: תווית בימין (התחלה) · ערך משמאל — מספרים ב־LTR */
function Row({
  label,
  children,
  dense,
}: {
  label: string;
  children: ReactNode;
  dense?: boolean;
}) {
  return (
    <div
      dir="rtl"
      className={`flex justify-between items-baseline gap-2 border-b border-gray-700/30 ${dense ? "py-1" : "py-1.5"}`}
    >
      <span className="text-xs text-gray-500 shrink-0 font-medium text-start">{label}</span>
      <div className="min-w-0 text-end" dir="ltr">
        {children}
      </div>
    </div>
  );
}

/** קלט להזנה ידנית — קו תחתון; גרסה צרה לשורה אחת (קו רוחב · קו אורך · גובה) */
const inputEditRow =
  "w-full min-w-0 bg-transparent text-gray-100 border-0 border-b border-gray-600 py-1 text-sm font-sans leading-normal focus:outline-none focus:border-sky-500/80 transition-colors placeholder:text-gray-500";

const formatCoord = (n: number, decimals = 6) =>
  Number.isFinite(n) ? n.toFixed(decimals) : "—";

/** השוואה צפה — מונעת לולאות עדכון כשלחיצה חוזרת על אותה נקודה */
const COORD_EPS = 1e-9;
function coordsNearlyEqual(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): boolean {
  return (
    Math.abs(a.lat - b.lat) < COORD_EPS &&
    Math.abs(a.lng - b.lng) < COORD_EPS
  );
}

type SignalQualityHe = "חלש" | "בינוני" | "חזק" | "מצוין";
type SignalQualityEn = "Weak" | "Medium" | "Strong" | "Excellent";

function insToGpsQuality(
  status: InsStatusE
): { he: SignalQualityHe; en: SignalQualityEn; bars: number } {
  switch (status) {
    case InsStatusE.OK:
      return { he: "מצוין", en: "Excellent", bars: 4 };
    case InsStatusE.ALIGN:
      return { he: "בינוני", en: "Medium", bars: 2 };
    case InsStatusE.IGNORE_GPS:
      return { he: "חזק", en: "Strong", bars: 3 };
    case InsStatusE.FAIL:
      return { he: "חלש", en: "Weak", bars: 1 };
    default:
      return { he: "חלש", en: "Weak", bars: 0 };
  }
}

function tmapsStatus(status: InsStatusE): {
  he: string;
  en: "Connected" | "Ready" | "Disconnected" | "Calibrating";
} {
  switch (status) {
    case InsStatusE.OK:
      return { he: "מחובר", en: "Connected" };
    case InsStatusE.ALIGN:
      return { he: "כיול", en: "Calibrating" };
    case InsStatusE.IGNORE_GPS:
      return { he: "מוכן", en: "Ready" };
    default:
      return { he: "מנותק", en: "Disconnected" };
  }
}

function tmapsStatusTextClass(
  en: ReturnType<typeof tmapsStatus>["en"]
): string {
  switch (en) {
    case "Connected":
      return "text-emerald-400";
    case "Ready":
      return "text-sky-400";
    case "Calibrating":
      return "text-amber-400";
    default:
      return "text-red-400/90";
  }
}

function SignalBars({ bars, max = 4 }: { bars: number; max?: number }) {
  return (
    <div className="flex items-end gap-px h-3.5 opacity-90" aria-hidden>
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={`w-[2px] rounded-[1px] ${i < bars ? "bg-sky-400" : "bg-gray-600"}`}
          style={{ height: `${5 + i * 2.5}px` }}
        />
      ))}
    </div>
  );
}

/** ערכים בפונט מערכת רגיל (כמו שדות במכ״ם) */
const val = "text-sm font-sans text-gray-100 tabular-nums";

/** שורת מפסק זהה ל־RadarForm: אותן מחלקות, אותו ToggleSwitch */
function RadarStyleToggleRow({
  enabled,
  onToggle,
  rightLabel,
  ariaLabel,
}: {
  enabled: boolean;
  onToggle: () => void;
  rightLabel: string;
  ariaLabel: string;
}) {
  return (
    <div className="mb-5" dir="ltr">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span
            className={`mr-4 text-sm font-medium min-w-[60px] ${enabled ? "text-sky-200" : "text-gray-400"}`}
          >
            {enabled ? "פעיל" : "כבוי"}
          </span>
          <ToggleSwitch
            checked={enabled}
            onChange={onToggle}
            activeColor="bg-sky-500"
            inactiveColor="bg-gray-600"
            size="md"
            ariaLabel={ariaLabel}
          />
          <span className="ml-2 text-sm min-w-[60px] font-medium text-[transparent] select-none" aria-hidden>
            .
          </span>
        </div>
        <span className="text-sm text-sky-100 font-medium">{rightLabel}</span>
      </div>
    </div>
  );
}

export interface LocationFormProps {
  /** לחיצה אחרונה על המפה — כמו ב־Status Bar → TMAPS-INS כשמפעילים מיקום ידני */
  clickedCoords?: { lat: number; lng: number } | null;
}

export default function LocationForm({ clickedCoords = null }: LocationFormProps) {
  const dispatch = useAppDispatch();
  const { isUTM, formatPos } = useCoordinateFormat();
  const myPosition = useAppSelector((s) => s.myPosition);
  const insStatus = useAppSelector((s) => s.ins.status);
  const prevManualOpen = useRef(false);
  /** נקודה אחרונה שסונכרנה מהמפה — מונעת setState כפול לאותו קליק */
  const lastAppliedMapClickRef = useRef<{ lat: number; lng: number } | null>(null);

  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [tmapsEnabled, setTmapsEnabled] = useState(true);
  const [manualOpen, setManualOpen] = useState(false);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [altInput, setAltInput] = useState("");

  const coords = myPosition.coordinates;
  const lat = coords?.lat ?? 0;
  const lng = coords?.lng ?? 0;
  const alt = coords?.alt ?? 0;

  const positionDisplay = useMemo(() => formatPos(lat, lng), [formatPos, lat, lng]);
  const gpsQ = useMemo(() => insToGpsQuality(insStatus), [insStatus]);
  const tmaps = useMemo(() => tmapsStatus(insStatus), [insStatus]);
  /** TMAPS מנותק (NO_COMM / FAIL וכו׳) — מאפרים את כל הבלוק מעל שורת הכפתורים */
  const tmapsDisconnected = tmaps.en === "Disconnected";
  const satelliteCount =
    insStatus === InsStatusE.OK ? 12 : insStatus === InsStatusE.ALIGN ? 6 : 0;

  const distanceKm = useMemo(() => {
    const base = Math.abs(lat) + Math.abs(lng);
    return (base % 1000) * 0.001;
  }, [lat, lng]);

  /** בעת פתיחת "הזנה ידנית" — טוען מהמיקום הנוכחי (לא מנקה בכל עדכון GPS בזמן עריכה) */
  useEffect(() => {
    if (manualOpen && !prevManualOpen.current) {
      setLatInput(formatCoord(lat));
      setLngInput(formatCoord(lng));
      setAltInput(Number.isFinite(alt) ? formatCoord(alt, 2) : "0");
      lastAppliedMapClickRef.current = null;
    }
    prevManualOpen.current = manualOpen;
  }, [manualOpen, lat, lng, alt]);

  /** כמו TMAPS-INS: בזמן שהזנה ידנית פתוחה, לחיצה על המפה ממלאת קו רוחב וקו אורך — בלי setState לריק */
  useEffect(() => {
    if (!manualOpen || !clickedCoords) return;
    const next = { lat: clickedCoords.lat, lng: clickedCoords.lng };
    const prev = lastAppliedMapClickRef.current;
    if (prev !== null && coordsNearlyEqual(prev, next)) return;
    lastAppliedMapClickRef.current = next;
    const latStr = formatCoord(next.lat);
    const lngStr = formatCoord(next.lng);
    setLatInput((p) => (p === latStr ? p : latStr));
    setLngInput((p) => (p === lngStr ? p : lngStr));
  }, [manualOpen, clickedCoords]);

  const onConfirmManual = useCallback(() => {
    const la = parseFloat(latInput.replace(/,/g, "."));
    const lo = parseFloat(lngInput.replace(/,/g, "."));
    const al = parseFloat(altInput.replace(/,/g, "."));
    if (!Number.isFinite(la) || !Number.isFinite(lo)) return;
    dispatch(
      updateMyCoordinates({
        lat: la,
        lng: lo,
        alt: Number.isFinite(al) ? al : alt,
      })
    );
    setManualOpen(false);
  }, [dispatch, latInput, lngInput, altInput, alt]);

  return (
    <div
      dir="rtl"
      lang="he"
      className="w-full px-0.5 py-1 font-sans text-sm text-gray-200 antialiased"
    >
      <div
        className={
          tmapsDisconnected
            ? "opacity-40 pointer-events-none select-none"
            : ""
        }
        aria-disabled={tmapsDisconnected}
      >
        <header className="mb-3 pb-2 border-b border-gray-700/35">
          <h3 className="text-base font-semibold text-white text-center">מיקום</h3>
          <p className="text-xs text-gray-500 text-center mt-0.5">
          GPS · TMAPS · קלט ידני · תצוגה: {isUTM ? "UTM" : "WGS84"} (סרגל עליון → INS)
        </p>
        </header>

        {/* GPS — שורת מפסק כמו בטופס מכ״ם */}
        <section className="mb-3">
          <RadarStyleToggleRow
            enabled={gpsEnabled}
            onToggle={() => setGpsEnabled(!gpsEnabled)}
            rightLabel="אפשר GPS"
            ariaLabel="אפשר GPS"
          />

          <div
            className={`space-y-0 ${gpsEnabled ? "" : "opacity-35 pointer-events-none"}`}
          >
            <Row label={isUTM ? "מיקום (UTM)" : "מיקום (WGS84)"}>
              <span className={`${val} text-xs break-all`}>{positionDisplay}</span>
            </Row>
            {/* גובה | מהירות | כיוון — 3 עמודות בשורה אחת */}
              
            <Row label="לוויינים" dense>
              <span className={val}>{satelliteCount > 0 ? satelliteCount : "—"}</span>
            </Row>
            <Row label="אות GPS" dense>
              <span className="flex items-center gap-2 flex-wrap justify-end flex-row-reverse">
                <span className={val}>
                  {gpsQ.he}
                  <span className="text-gray-500 text-xs mx-0.5">({gpsQ.en})</span>
                </span>
                <SignalBars bars={gpsQ.bars} />
              </span>
            </Row>
          </div>
        </section>

        {/* TMAPS */}
        <section className="mb-3 pt-3 border-t border-gray-700/30">
          <RadarStyleToggleRow
            enabled={tmapsEnabled}
            onToggle={() => setTmapsEnabled(!tmapsEnabled)}
            rightLabel="אפשר TMAPS"
            ariaLabel="אפשר TMAPS"
          />

          <div
            className={`space-y-0 ${tmapsEnabled ? "" : "opacity-35 pointer-events-none"}`}
          >
            <Row label={isUTM ? "מיקום (UTM)" : "מיקום (WGS84)"}>
              <span className={`${val} text-xs break-all`}>{positionDisplay}</span>
            </Row>
            <Row label="סטטוס" dense>
              <span className={`text-xs font-medium ${tmapsStatusTextClass(tmaps.en)}`}>
                {tmaps.he}
                <span className="text-gray-500 font-normal mx-0.5">{tmaps.en}</span>
              </span>
            </Row>
            <Row label="מרחק" dense>
              <span className={val}>{distanceKm.toFixed(3)} ק״מ</span>
            </Row>
            <Row label="Pitch · Roll" dense>
              <span className={`${val} text-xs`}>0.0° · 0.0°</span>
            </Row>
          </div>
        </section>
      </div>

      <div
        className={`flex flex-col gap-0 pt-2 border-t border-gray-700/30 ${!tmapsEnabled ? "opacity-35 pointer-events-none" : ""}`}
      >
        <button
          type="button"
          className="w-full py-1.5 text-xs font-medium text-sky-400/95 hover:text-sky-300 hover:bg-white/[0.03] rounded transition-colors text-start px-0.5"
        >
          התחל כיול
        </button>
        <button
          type="button"
          className="w-full py-1.5 text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-white/[0.03] rounded transition-colors text-start px-0.5"
        >
          יישור מחדש
        </button>
        <button
          type="button"
          onClick={() => setManualOpen((o) => !o)}
          className="w-full py-1.5 text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-white/[0.03] rounded transition-colors text-start px-0.5"
        >
          {manualOpen ? "סגור הזנה ידנית" : "הזנת מיקום ידנית"}
        </button>
      </div>

      {manualOpen && (
        <div className="mt-2 pt-2 border-t border-gray-700/30 space-y-1.5" dir="rtl">
          <p className="text-xs text-gray-500 text-start">הזנה ידנית · WGS84</p>

          <div className="w-full" dir="ltr">
            <div className="flex gap-1.5 items-end">
              <div className="min-w-0 flex-[1.15]">
                <label className="block text-[10px] text-gray-500 mb-0.5 truncate text-center font-sans" dir="rtl">
                  קו רוחב
                </label>
                <input
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  placeholder="32.0853"
                  className={inputEditRow}
                  inputMode="decimal"
                  autoComplete="off"
                  spellCheck={false}
                  title="Latitude"
                />
              </div>
              <div className="min-w-0 flex-[1.15]">
                <label className="block text-[10px] text-gray-500 mb-0.5 truncate text-center font-sans" dir="rtl">
                  קו אורך
                </label>
                <input
                  value={lngInput}
                  onChange={(e) => setLngInput(e.target.value)}
                  placeholder="34.7818"
                  className={inputEditRow}
                  inputMode="decimal"
                  autoComplete="off"
                  spellCheck={false}
                  title="Longitude"
                />
              </div>
              <div className="min-w-0 w-14 shrink-0 sm:w-16">
                <label className="block text-[10px] text-gray-500 mb-0.5 truncate text-center font-sans" dir="rtl">
                  גובה
                </label>
                <input
                  value={altInput}
                  onChange={(e) => setAltInput(e.target.value)}
                  placeholder="מ׳"
                  className={inputEditRow}
                  inputMode="decimal"
                  title="Altitude (m)"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-0.5" dir="rtl">
            <button
              type="button"
              onClick={onConfirmManual}
              className="flex-1 py-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors text-center"
            >
              אישור
            </button>
            <button
              type="button"
              onClick={() => setManualOpen(false)}
              className="flex-1 py-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors text-center"
            >
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
