import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaExclamationTriangle } from "react-icons/fa";
import {
  selectPopupQueue,
  dismissPopup,
  getBadge,
  Fault,
  selectMasterCautionOn,
  acknowledgeAll,
} from "../../store/slices/faultsSlice";
import { ErrorSeverityE } from "../../enums/general.enum";

const DISMISS_TTL_MS = 60_000;

export default function ToastHost() {
  const dispatch = useDispatch();

  const queue = useSelector(selectPopupQueue) as Fault[];
  const visible = queue && queue.length > 0 ? queue.slice(0, 4) : [];
  const masterOn = useSelector(selectMasterCautionOn) as boolean;

  const closeNow = (fault: Fault) => {
    if (!fault) return;
    dispatch(dismissPopup({ id: fault.id, ttlMs: DISMISS_TTL_MS }));
  };

  useEffect(() => {
    // placeholder to keep React import happy if we later add side‑effects
  }, []);

  if (visible.length === 0 && !masterOn) return null;

  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none select-none">
      {masterOn && (
        <div className="mb-2 flex items-center justify-center gap-2">
          <button
            className="pointer-events-auto px-3 py-1 rounded font-semibold border transition bg-red-600 border-red-400 text-white animate-pulse"
            onClick={() => dispatch(acknowledgeAll())}
          >
            MASTER CAUTION
          </button>
        </div>
      )}

      {visible.map((fault) => {
        const badge = getBadge(fault);
        const isCritical = fault.severity === ErrorSeverityE.SEVERE;
        return (
          <div
            key={fault.id}
            className="pointer-events-auto min-w-[280px] max-w-[420px] rounded-xl px-3 py-3 border bg-neutral-900 border-neutral-700 text-neutral-100 shadow mb-2 last:mb-0"
          >
            <div className="flex items-start gap-3">
              <FaExclamationTriangle
                size={22}
                className={isCritical ? "text-red-400" : "text-amber-300"}
              />

              <div className="flex-1 text-right">
                <div className="text-xs text-neutral-400 mb-1">
                  {badge?.label} | {fault.category} | #{fault.code}
                </div>
                <div className="text-sm whitespace-normal break-words">
                  {fault.description}
                </div>
              </div>

              <button
                className="ml-1 text-base px-2 py-0.5 rounded text-neutral-300 hover:text-white"
                onClick={() => closeNow(fault)}
              >
                X
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
