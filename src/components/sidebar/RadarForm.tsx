import type { ReactNode } from "react";
import ToggleSwitch from "../ui/ToggleSwitch";
import { useAppSelector } from "../../hooks/useAppSelector";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { useWebSocket } from "../../hooks/useWebSocket";
import { RadarStateE } from "../../enums/statusBar.enum";
import { WsMessageName } from "../../enums/ws.enum";
import {
  hydrateFormFromServer,
  updateFormValue,
} from "../../store/slices/radarSlice";
import {
  buildSetRadarParamsPayload,
  RADAR_PARAM_KEYS,
} from "../../store/slices/radarParamsWire";

const FREQ_OPTIONS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const MISSION_OPTIONS = ["1", "2", "3", "4", "5"];

function modeLabel(mode: RadarStateE): string {
  return RadarStateE[mode] ?? String(mode);
}

const RadarForm = () => {
  const dispatch = useAppDispatch();
  const { sendMessage } = useWebSocket();
  const { formValues, serverValues, mismatches } = useAppSelector((s) => s.radar);

  const hasPending = RADAR_PARAM_KEYS.some((k) => mismatches[k]);

  const sendParams = () => {
    sendMessage(WsMessageName.SetRadarParams, buildSetRadarParamsPayload(formValues));
  };

  const isOperate = formValues.mode === RadarStateE.OPERATE;

  return (
    <div className="w-full max-w-md mx-auto p-4 font-sans text-right text-zinc-100">
      <div className="mb-4 border-b border-zinc-700 pb-3">
        <h3 className="text-lg font-semibold tracking-tight">מכ״ם — פרמטרים</h3>
        <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
          <span className="text-zinc-300">טיוטה</span> — מה שאתה עורך.{" "}
          <span className="text-zinc-500">|</span>{" "}
          <span className="text-emerald-400/90">במכשיר</span> — אושר מהשרת לאחרונה.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-zinc-700/80 bg-zinc-900/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-400 shrink-0">מצב מבצעי</span>
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`text-sm font-medium truncate ${
                  isOperate ? "text-sky-300" : "text-zinc-400"
                }`}
              >
                {isOperate ? "מבצעי" : modeLabel(formValues.mode)}
              </span>
              <ToggleSwitch
                checked={isOperate}
                onChange={() =>
                  dispatch(
                    updateFormValue({
                      field: "mode",
                      value: isOperate ? RadarStateE.STANDBY : RadarStateE.OPERATE,
                    })
                  )
                }
                activeColor="bg-sky-500"
                inactiveColor="bg-zinc-600"
                size="sm"
                ariaLabel="החלפת מצב מבצעי"
              />
            </div>
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-zinc-500 gap-2">
            <span>טיוטה: {modeLabel(formValues.mode)}</span>
            <span className="text-emerald-500/90">
              במכשיר: {modeLabel(serverValues.mode)}
            </span>
          </div>
          {mismatches.mode && (
            <p className="mt-1.5 text-[11px] text-amber-400/90">
              ערך השליחה שונה ממה שהמכשיר דיווח
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          <FieldBlock
            label="סוג משימה"
            mismatch={!!mismatches.missionCategory}
            draft={
              <select
                value={String(formValues.missionCategory)}
                onChange={(e) =>
                  dispatch(
                    updateFormValue({
                      field: "missionCategory",
                      value: Number.parseInt(e.target.value, 10) || 1,
                    })
                  )
                }
                className="w-full rounded-md border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40"
              >
                {MISSION_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            }
            serverText={String(serverValues.missionCategory)}
          />

          <FieldBlock
            label="תדר (מדד)"
            mismatch={!!mismatches.freqIndex}
            draft={
              <select
                value={String(formValues.freqIndex)}
                onChange={(e) =>
                  dispatch(
                    updateFormValue({
                      field: "freqIndex",
                      value: Number.parseInt(e.target.value, 10) || 0,
                    })
                  )
                }
                className="w-full rounded-md border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40"
              >
                {FREQ_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            }
            serverText={String(serverValues.freqIndex)}
          />

          <div className="grid grid-cols-2 gap-2">
            <FieldBlock
              label="גובה מינימלי"
              mismatch={!!mismatches.min_elevation}
              draft={
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(formValues.min_elevation)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    dispatch(
                      updateFormValue({
                        field: "min_elevation",
                        value: raw === "" ? 0 : Number.parseInt(raw, 10),
                      })
                    );
                  }}
                  className="w-full rounded-md border border-zinc-600 bg-zinc-950 px-2 py-2 text-center text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40"
                />
              }
              serverText={String(serverValues.min_elevation)}
            />
            <FieldBlock
              label="גיזרת החסמה"
              mismatch={!!mismatches.blanking_sectors}
              draft={
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(formValues.blanking_sectors)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    dispatch(
                      updateFormValue({
                        field: "blanking_sectors",
                        value: raw === "" ? 0 : Number.parseInt(raw, 10),
                      })
                    );
                  }}
                  className="w-full rounded-md border border-zinc-600 bg-zinc-950 px-2 py-2 text-center text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/40"
                />
              }
              serverText={String(serverValues.blanking_sectors)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => dispatch(hydrateFormFromServer())}
            disabled={!hasPending}
            className="rounded-md border border-zinc-600 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none"
          >
            איפוס לערכי השרת
          </button>
          <button
            type="button"
            onClick={sendParams}
            disabled={!hasPending}
            className="rounded-md bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-40 disabled:pointer-events-none"
          >
            שלח להגדרה
          </button>
        </div>
      </div>
    </div>
  );
};

function FieldBlock(props: {
  label: string;
  mismatch: boolean;
  draft: ReactNode;
  serverText: string;
}) {
  const { label, mismatch, draft, serverText } = props;
  return (
    <div
      className={`rounded-lg border p-3 ${
        mismatch ? "border-amber-600/50 bg-amber-950/15" : "border-zinc-700/80 bg-zinc-900/30"
      }`}
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-zinc-300">{label}</span>
        <span className="text-[10px] text-emerald-500/90 whitespace-nowrap">
          במכשיר: {serverText}
        </span>
      </div>
      {draft}
    </div>
  );
}

export default RadarForm;
