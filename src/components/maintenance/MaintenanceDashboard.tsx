import React, { memo, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../hooks/useAppSelector";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { clearModeSelection } from "../../store/slices/systemSlice";
import { SelectedModeE } from "../../enums/general.enum";
import {
  GunStatusE,
  InsStatusE,
  RadarStateE,
  RadarStatusE,
} from "../../enums/statusBar.enum";
import { useWebSocket } from "../../hooks/useWebSocket";
import RenderInsIcon from "../layout/statusBar/RenderInsIcon";
import RenderGunIcon from "../layout/statusBar/RenderGunIcon";
import RenderRadarIcon from "../layout/statusBar/RenderRadarIcon";

type Panel = "ins" | "gun" | "radar";

function fmtNum(n: unknown, digits = 4): string {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(digits) : "—";
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] py-2.5 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="min-w-0 shrink font-mono text-right text-slate-100 tabular-nums">{value}</span>
    </div>
  );
}

const MaintenanceDashboard: React.FC = () => {
  useWebSocket();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [panel, setPanel] = useState<Panel>("ins");
  const [tick, setTick] = useState(0);

  const insStatus = useAppSelector((s) => s.ins.status as InsStatusE);
  const gunStatus = useAppSelector((s) => s.gun.status as GunStatusE | undefined);
  const guns = useAppSelector((s) => s.gun.guns);
  const radarStatus = useAppSelector((s) => s.radar.status as RadarStatusE | null);
  const radarServer = useAppSelector((s) => s.radar.serverValues);
  const radarRange = useAppSelector((s) => s.radar.radarRange);
  const radarNon = useAppSelector((s) => s.radar.radarNonCoverage);
  const my = useAppSelector((s) => s.myPosition);
  const selectedMode = useAppSelector((s) => s.systemState.selectedMode);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (selectedMode !== SelectedModeE.Maintenance) {
      navigate("/mode", { replace: true });
    }
  }, [selectedMode, navigate]);

  const nowLabel = useMemo(() => new Date().toLocaleString("he-IL"), [tick]);

  const gunRows = useMemo(() => {
    const entries = Object.values(guns || {});
    if (!entries.length) return null;
    return entries.map((g) => (
      <DataRow key={g.gunId} label={`תותח ${g.gunId}`} value={GunStatusE[g.status]} />
    ));
  }, [guns]);

  const leave = () => {
    dispatch(clearModeSelection());
    navigate("/mode", { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070a10] text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(56, 189, 248, 0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(99, 102, 241, 0.12), transparent 50%)",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-10 pt-8 sm:px-8">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-cyan-400/80">תחזוקה</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">לוח בקרת מערכות</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
              נתונים חיים מהמצב האחרון שהתקבל מהרשת. בחרו מערכת כדי לראות פירוט מלא.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className="text-xs text-slate-500">עדכון שעון מקומי</span>
            <span className="font-mono text-sm text-slate-300">{nowLabel}</span>
            <button
              type="button"
              onClick={leave}
              className="mt-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur transition hover:border-cyan-500/40 hover:bg-cyan-500/10"
            >
              חזרה לבחירת מצב
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(
            [
              { id: "ins" as const, title: "INS", subtitle: "ניווט ועמדה", icon: <RenderInsIcon status={insStatus} /> },
              { id: "gun" as const, title: "GUN", subtitle: "תותח", icon: <RenderGunIcon status={gunStatus ?? GunStatusE.NO_COMM} /> },
              {
                id: "radar" as const,
                title: "RADAR",
                subtitle: "מכ״ם",
                icon: <RenderRadarIcon status={radarStatus ?? RadarStatusE.NO_COMM} />,
              },
            ] as const
          ).map((c) => {
            const active = panel === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setPanel(c.id)}
                className={`group relative flex flex-col items-center rounded-2xl border px-6 py-8 text-center transition-all duration-300 ${
                  active
                    ? "border-cyan-400/50 bg-gradient-to-b from-cyan-500/15 to-white/[0.04] shadow-[0_0_40px_-8px_rgba(34,211,238,0.35)]"
                    : "border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                }`}
              >
                <div
                  className={`mb-4 flex h-20 w-20 items-center justify-center rounded-2xl transition-transform duration-300 ${
                    active ? "scale-110 bg-cyan-500/10" : "bg-white/5 group-hover:scale-105"
                  }`}
                >
                  <div className="scale-[2] [&>div]:mt-0">{c.icon}</div>
                </div>
                <span className="text-lg font-semibold tracking-wide text-white">{c.title}</span>
                <span className="mt-1 text-xs text-slate-500">{c.subtitle}</span>
                {active && (
                  <span className="mt-3 text-[10px] font-medium uppercase tracking-widest text-cyan-300/90">פעיל</span>
                )}
              </button>
            );
          })}
        </div>

        <section className="mt-8 flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-md sm:p-8">
          {panel === "ins" && (
            <div className="transition-opacity duration-300">
              <h2 className="mb-6 text-lg font-medium text-white">INS — מצב ועמדה</h2>
              <div className="grid gap-0 sm:grid-cols-2">
                <DataRow label="סטטוס TMAPS / INS" value={InsStatusE[insStatus] ?? insStatus} />
                <DataRow label="כיוון (°)" value={fmtNum(my.heading, 2)} />
                <DataRow label="Pitch (°)" value={fmtNum(my.pitch, 2)} />
                <DataRow label="Roll (°)" value={fmtNum(my.roll, 2)} />
                <DataRow label="מיקום פעיל (lat)" value={fmtNum(my.coordinates?.lat, 6)} />
                <DataRow label="מיקום פעיל (lng)" value={fmtNum(my.coordinates?.lng, 6)} />
                <DataRow label="GPS" value={`${fmtNum(my.gps_pos?.lat, 5)}, ${fmtNum(my.gps_pos?.lng, 5)}`} />
                <DataRow label="TMAPS" value={`${fmtNum(my.tmaps_pos?.lat, 5)}, ${fmtNum(my.tmaps_pos?.lng, 5)}`} />
                <DataRow label="שימוש ב-GPS" value={String(my.use_gps)} />
                <DataRow label="שימוש בידני" value={String(my.use_manual)} />
                <DataRow label="אזור" value={String(my.zone)} />
                <DataRow label="Fig of merit" value={fmtNum(my.fig_of_merit, 2)} />
                <DataRow label="מרחק מצטבר" value={fmtNum(my.distance_travelled, 2)} />
              </div>
            </div>
          )}

          {panel === "gun" && (
            <div className="transition-opacity duration-300">
              <h2 className="mb-6 text-lg font-medium text-white">GUN — תותח</h2>
              <div className="max-w-xl space-y-0">
                <DataRow label="סטטוס כללי" value={gunStatus != null ? GunStatusE[gunStatus] : "—"} />
                <DataRow label="אזימוט כיוון (°)" value={fmtNum(my.gunAzimut, 2)} />
                {gunRows}
                {!gunRows && <p className="py-4 text-sm text-slate-500">אין רשומות תותח נפרדות — מוצג סטטוס כללי בלבד.</p>}
              </div>
            </div>
          )}

          {panel === "radar" && (
            <div className="transition-opacity duration-300">
              <h2 className="mb-6 text-lg font-medium text-white">RADAR — מכ״ם</h2>
              <div className="grid gap-0 sm:grid-cols-2">
                <DataRow label="סטטוס תצוגה" value={radarStatus != null ? RadarStatusE[radarStatus] : "—"} />
                <DataRow label="סטטוס שרת" value={RadarStatusE[radarServer.state]} />
                <DataRow label="מצב עבודה" value={RadarStateE[radarServer.mode]} />
                <DataRow label="חדר עבודה" value={String(radarServer.workRoom)} />
                <DataRow label="קטגוריית משימה" value={String(radarServer.missionCategory)} />
                <DataRow label="אינדקס תדר" value={String(radarServer.freqIndex)} />
                <DataRow label="גובה מינימלי" value={String(radarServer.min_elevation)} />
                <DataRow label="מגזרי בלנקינג" value={String(radarServer.blanking_sectors)} />
                <DataRow label="טווח (מ׳)" value={String(radarRange)} />
                <DataRow
                  label="מגזרי אי-כיסוי"
                  value={
                    radarNon && radarNon.length ? (
                      <span className="break-all text-xs leading-snug">{radarNon.join(", ")}</span>
                    ) : (
                      "—"
                    )
                  }
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default memo(MaintenanceDashboard);
