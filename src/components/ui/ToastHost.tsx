import { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaExclamationTriangle } from "react-icons/fa";
import {
  selectPopupQueue,
  dismissPopup,
  popNextPopup,
  getBadge,
  Fault,
  selectMasterCautionOn,
  acknowledgeAll,
} from "../../store/slices/faultsSlice";
import { ErrorSeverityE } from "../../enums/general.enum";

const DISMISS_TTL_MS = 60_000;
const TOAST_TTL_MS = 8_000;

export default function ToastHost() {
  const dispatch = useDispatch();

  const queue = useSelector(selectPopupQueue) as Fault[];
  const first = queue && queue.length > 0 ? queue[0] : null;

  const masterOn = useSelector(selectMasterCautionOn) as boolean;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIdRef = useRef<string | null>(null);

  const isMasterToast = useMemo(() => {
    if (!first) return false;
    return first.severity === ErrorSeverityE.SEVERE;
  }, [first]);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!first) {
      activeIdRef.current = null;
      return;
    }

    if (activeIdRef.current === first.id) return;
    activeIdRef.current = first.id;

    timerRef.current = setTimeout(() => {
      dispatch(popNextPopup());
      activeIdRef.current = null;
      timerRef.current = null;
    }, TOAST_TTL_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [first?.id, dispatch]);

  const closeNow = () => {
    if (!first) return;
    dispatch(dismissPopup({ id: first.id, ttlMs: DISMISS_TTL_MS }));
    dispatch(popNextPopup());
    activeIdRef.current = null;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  if (!first && !masterOn) return null;

  const badge = first ? getBadge(first) : null;

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

      {first && (
        <div className="pointer-events-auto min-w-[280px] max-w-[420px] rounded-xl px-3 py-3 border bg-neutral-900 border-neutral-700 text-neutral-100 shadow">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle
              size={22}
              className={isMasterToast ? "text-red-400" : "text-amber-300"}
            />

            <div className="flex-1 text-right">
              <div className="text-xs text-neutral-400 mb-1">
                {badge?.label} | {first.category} | #{first.code}
              </div>
              <div className="text-sm whitespace-normal break-words">
                {first.description}
              </div>
            </div>

            <button
              className="ml-1 text-base px-2 py-0.5 rounded text-neutral-300 hover:text-white"
              onClick={closeNow}
            >
              X
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
