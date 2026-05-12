import { useCallback, useEffect, useState, type ReactNode } from "react";
import ToggleSwitch from "../ui/ToggleSwitch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { updateMyCali, updateMyCoordinates } from "../../store/slices/myPositionSlice";
import { useWebSocket } from "../../hooks/useWebSocket";
import { WsMessageName } from "../../enums/ws.enum";
import { CaliModeE, PosTypeE } from "../../enums/general.enum";
import { store } from "../../store/store";
import { InsStatusE } from "../../enums/statusBar.enum";
import { servers } from "../../config/communication.json";
import { toggleCoordinateSystem, setUTMZone } from "../../store/slices/coordinatesSlice";
import { formatCoordinates, parseUTMString, utmToWGS84 } from "../../utils/coordinates";

const formatCoord = (n: number, decimals = 6) =>
  Number.isFinite(n) ? n.toFixed(decimals) : "—";

export const formatOneDecimal = (value: number | undefined | null): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toFixed(1);
};

const inputField =
  "w-full min-w-0 rounded border border-zinc-600 bg-zinc-950 px-2 py-1.5 text-center text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/30";

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-700/70 bg-zinc-900/35 overflow-hidden">
      <div className="border-b border-zinc-700/50 bg-zinc-950/40 px-2.5 py-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="text-xs font-semibold text-zinc-100">{title}</h4>
          {subtitle ? (
            <span className="text-[10px] text-zinc-500 tabular-nums">{subtitle}</span>
          ) : null}
        </div>
      </div>
      <div className="p-2 space-y-1.5">{children}</div>
    </section>
  );
}

function Stat({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-[11px] leading-tight">
      <span className="text-zinc-500 shrink-0">{label}</span>
      <span
        className={`min-w-0 truncate text-left text-zinc-100 ${mono ? "font-mono tabular-nums" : "font-medium"}`}
        dir="ltr"
      >
        {value}
      </span>
    </div>
  );
}

export default function LocationForm() {
  const dispatch = useAppDispatch();
  const myPosition = useAppSelector((s) => s.myPosition);
  const tmapsStatus = useAppSelector((s) => s.ins.status);
  const isUTM = useAppSelector((s) => s.coordinates.isUTM);
  const utmZone = useAppSelector((s) => s.coordinates.utmZone);
  const { sendMessage } = useWebSocket();
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [altInput, setAltInput] = useState(0);
  const [headInput, setHeadInput] = useState(0);
  const [utmInput, setUtmInput] = useState("");

  const coords = myPosition.coordinates;
  const lat = coords?.lat ?? 0;
  const lng = coords?.lng ?? 0;
  const alt = coords?.alt ?? 0;

  const insBlocked = tmapsStatus === InsStatusE.NO_COMM;

  useEffect(() => {
    if (manualOpen && myPosition.clickCord) {
      setLatInput(myPosition.clickCord.lat.toString().slice(0, 7));
      setLngInput(myPosition.clickCord.lng.toString().slice(0, 7));
      setUtmInput(
        formatCoordinates({ lat: myPosition.clickCord.lat, lng: myPosition.clickCord.lng }, isUTM, utmZone)
      );
    }
  }, [myPosition.clickCord, manualOpen, isUTM, utmZone]);

  useEffect(() => {
    if (myPosition.use_manual) {
      setManualOpen(true);
    }
  }, [myPosition.use_manual]);

  useEffect(() => {
    if (manualOpen) {
      setLatInput(formatCoord(lat));
      setLngInput(formatCoord(lng));
      setUtmInput(formatCoordinates({ lat, lng }, isUTM, utmZone));
      setHeadInput((h) => h || 0);
    }
  }, [manualOpen, lat, lng, isUTM, utmZone]);

  useEffect(() => {
    if (manualOpen) {
      if (latInput === "" || lngInput === "") {
        setUtmInput(formatCoordinates({ lat, lng }, isUTM, utmZone));
      } else {
        setUtmInput(formatCoordinates({ lat: Number(latInput), lng: Number(lngInput) }, isUTM, utmZone));
      }
    }
  }, [isUTM, manualOpen, latInput, lngInput, lat, lng, utmZone]);

  const onConfirmManual = useCallback(async () => {
    const la = parseFloat(latInput.replace(/,/g, "."));
    const lo = parseFloat(lngInput.replace(/,/g, "."));
    const al = parseFloat(altInput.toString().replace(/,/g, "."));
    let finaAlt = Number.isFinite(al) ? al : alt;
    if (!Number.isFinite(la) || !Number.isFinite(lo)) return;
    dispatch(
      updateMyCoordinates({
        lat: la,
        lng: lo,
        alt: Number.isFinite(al) ? al : alt,
      })
    );
    try {
      const url = `http://${servers.mapServer}/elevation?lon=${lngInput}&lat=${latInput}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        finaAlt = data;
        setAltInput(data);
      }
    } catch {
      /* elevation optional */
    }

    sendMessage(WsMessageName.SetPosType, { pos: PosTypeE.Manual });
    sendMessage(WsMessageName.SetPosition, {
      manual_pos: {
        lat: latInput,
        lng: lngInput,
        alt: finaAlt,
        heading: headInput,
      },
    });
  }, [dispatch, latInput, lngInput, headInput, altInput, alt, sendMessage]);

  const posSourceLabel = myPosition.use_manual ? "ידני" : "TMAPS";

  return (
    <div dir="rtl" lang="he" className="w-full max-w-sm mx-auto px-1 py-0.5 font-sans text-zinc-200 antialiased">
      <header className="mb-2 border-b border-zinc-700/60 pb-2">
        <h3 className="text-base font-semibold tracking-tight text-zinc-50">מיקום</h3>
        <p className="mt-0.5 text-[11px] text-zinc-500">מקורות GPS ו־TMAPS, כיול והזנה ידנית</p>
      </header>

      <div className="space-y-2">
        <div
          className={`space-y-2 ${insBlocked ? "opacity-40 pointer-events-none select-none" : ""}`}
          aria-hidden={insBlocked || undefined}
        >
          <SectionCard title="GPS" subtitle={isUTM ? `UTM · ${utmZone}` : "WGS84"}>
          <div className="flex items-center justify-between gap-2 py-0.5">
            <span className="text-[11px] text-zinc-400">שימוש ב־GPS</span>
            <div className="flex items-center gap-2" dir="ltr">
              <span className="text-[11px] text-zinc-500 w-6 text-center">{gpsEnabled ? "כן" : "לא"}</span>
              <ToggleSwitch
                checked={gpsEnabled}
                onChange={() => {
                  sendMessage(WsMessageName.GpsIntegration, { use_gps: !gpsEnabled });
                  setGpsEnabled(!gpsEnabled);
                }}
                activeColor="bg-sky-500"
                inactiveColor="bg-zinc-600"
                size="sm"
                ariaLabel="שימוש ב-GPS"
              />
            </div>
          </div>
          <div
            className="rounded border border-zinc-700/50 bg-zinc-950/50 px-2 py-1.5 font-mono text-[11px] leading-snug text-amber-200/95 break-all"
            dir="ltr"
            title={formatCoordinates(myPosition.gps_pos, isUTM, utmZone)}
          >
            {formatCoordinates(myPosition.gps_pos, isUTM, utmZone)}
            <span className="text-zinc-500"> · </span>
            <span className="text-zinc-300">Alt {myPosition.gps_pos.alt}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-0.5 border-t border-zinc-800/80">
            <Stat label="Fig of merit" value={myPosition.fig_of_merit} mono />
            <Stat label="אזור" value={myPosition.zone} mono />
          </div>
        </SectionCard>

        <SectionCard title="TMAPS">
          <div
            className="rounded border border-zinc-700/50 bg-zinc-950/50 px-2 py-1.5 font-mono text-[11px] leading-snug text-amber-200/95 break-all"
            dir="ltr"
            title={formatCoordinates(myPosition.tmaps_pos, isUTM, utmZone)}
          >
            {formatCoordinates(myPosition.tmaps_pos, isUTM, utmZone)}
            <span className="text-zinc-500"> · </span>
            <span className="text-zinc-300">Alt {myPosition.tmaps_pos.alt}</span>
          </div>
          <div className="space-y-1 border-t border-zinc-800/80 pt-1.5">
            <Stat label="מרחק מצטבר" value={myPosition.distance_travelled} mono />
            <Stat label="כיול אודומטר" value={CaliModeE[myPosition.odo_cali_finished || 0]} />
            <Stat label="מקור מיקום" value={posSourceLabel} />
          </div>
          <div className="grid grid-cols-3 gap-1 rounded border border-zinc-700/40 bg-zinc-950/30 p-1" dir="ltr">
            {(
              [
                ["Hdg", myPosition.heading],
                ["Pitch", myPosition.pitch],
                ["Roll", myPosition.roll],
              ] as const
            ).map(([lab, v]) => (
              <div key={lab} className="text-center px-0.5">
                <div className="text-[9px] uppercase tracking-wide text-zinc-500">{lab}</div>
                <div className="font-mono text-xs font-semibold text-zinc-100 tabular-nums">
                  {formatOneDecimal(v)}
                  <span className="text-[10px] font-normal text-zinc-500">°</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            disabled={insBlocked}
            className="h-8 rounded-md border border-zinc-600 bg-zinc-800/80 text-[10px] font-medium text-sky-300 hover:bg-zinc-700 hover:text-sky-200 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            onClick={() => {
              sendMessage(WsMessageName.StartOdoCali, {});
              store.dispatch(updateMyCali(CaliModeE.NO));
            }}
          >
            כיול
          </button>
          <button
            type="button"
            disabled={insBlocked}
            className="h-8 rounded-md border border-zinc-600 bg-zinc-800/80 text-[10px] font-medium text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            onClick={() => sendMessage(WsMessageName.StartRealing, {})}
          >
            Realign
          </button>
          <button
            type="button"
            onClick={() => {
              setManualOpen((o) => {
                const next = !o;
                if (o) sendMessage(WsMessageName.SetPosType, { pos: PosTypeE.TMAPS });
                return next;
              });
            }}
            className={`h-8 rounded-md border text-[10px] font-medium transition-colors ${
              manualOpen
                ? "border-sky-600 bg-sky-950/50 text-sky-200"
                : "border-zinc-600 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            ידני
          </button>
        </div>

        {manualOpen && (
          <div className="rounded-lg border border-sky-900/40 bg-sky-950/10 p-2 space-y-2">
            <div className="text-[10px] font-medium text-sky-200/90">הזנה ידנית</div>
            <div className="w-full" dir="ltr">
              <div className="flex flex-wrap gap-1.5 items-end">
                {!isUTM && (
                  <div className="flex flex-1 min-w-0 gap-1.5">
                    <div className="min-w-0 flex-1">
                      <label className="mb-0.5 block text-center text-[9px] text-zinc-500" dir="rtl">
                        קו רוחב
                      </label>
                      <input
                        value={latInput}
                        onChange={(e) => setLatInput(e.target.value)}
                        placeholder="32.0853"
                        className={inputField}
                        inputMode="decimal"
                        autoComplete="off"
                        spellCheck={false}
                        title="Latitude"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <label className="mb-0.5 block text-center text-[9px] text-zinc-500" dir="rtl">
                        קו אורך
                      </label>
                      <input
                        value={lngInput}
                        onChange={(e) => setLngInput(e.target.value)}
                        placeholder="34.7818"
                        className={inputField}
                        inputMode="decimal"
                        autoComplete="off"
                        spellCheck={false}
                        title="Longitude"
                      />
                    </div>
                  </div>
                )}
                {isUTM && (
                  <div className="min-w-0 flex-1">
                    <label className="mb-0.5 block text-center text-[9px] text-zinc-500" dir="rtl">
                      UTM
                    </label>
                    <input
                      value={utmInput}
                      onChange={(e) => {
                        setUtmInput(e.target.value);
                        const latLngConvert = utmToWGS84(parseUTMString(e.target.value));
                        setLatInput(latLngConvert.lat.toString().slice(0, 8));
                        setLngInput(latLngConvert.lng.toString().slice(0, 8));
                      }}
                      className={inputField}
                      inputMode="text"
                      autoComplete="off"
                      spellCheck={false}
                      title="UTM"
                    />
                  </div>
                )}
                <div className="w-14 shrink-0">
                  <label className="mb-0.5 block text-center text-[9px] text-zinc-500" dir="rtl">
                    כיוון
                  </label>
                  <input
                    value={headInput}
                    onChange={(e) => setHeadInput(Number(e.target.value))}
                    className={inputField}
                    inputMode="decimal"
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onConfirmManual}
              className="w-full h-8 rounded-md bg-sky-600 text-xs font-semibold text-white hover:bg-sky-500 transition-colors"
            >
              אישור והגשה
            </button>
          </div>
        )}

        <div className="rounded-lg border border-zinc-700/60 bg-zinc-950/25 px-2 py-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] text-zinc-500">תצוגת קואורדינטות בממשק</span>
            <button
              type="button"
              onClick={() => dispatch(toggleCoordinateSystem())}
              className="rounded border border-zinc-600 bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-200 hover:bg-zinc-700"
            >
              {isUTM ? "UTM" : "WGS84"}
            </button>
          </div>
          {isUTM && myPosition.use_manual && (
            <label className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-zinc-400">
              <span>אזור UTM</span>
              <select
                value={utmZone}
                onChange={(e) => dispatch(setUTMZone(Number(e.target.value)))}
                className="rounded border border-zinc-600 bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-100"
              >
                {[33, 34, 35, 36, 37, 38].map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      {insBlocked && (
        <p className="mt-2 text-center text-[10px] text-amber-500/90 leading-relaxed px-1">
          אין תקשורת TMAPS — נתוני GPS/TMAPS אינם מתעדכנים. הזנה ידנית והחלפת תצוגת קואורדינטות זמינות.
        </p>
      )}
    </div>
  );
}
