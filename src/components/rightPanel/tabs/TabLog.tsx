import React, { useRef, useEffect } from "react";
import { useAppSelector } from "../../../hooks/useAppSelector";
import { useAppDispatch } from "../../../hooks/useAppDispatch";
import { clearLogs } from "../../../store/slices/logsSlice";
import { CONTENT, SECTION, SECTION_TITLE, BTN, BTN_SECONDARY } from "../panelStyles";

export function TabLog() {
  const lines = useAppSelector((s) => s.logs.lines);
  const dispatch = useAppDispatch();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  const handleClear = () => dispatch(clearLogs());
  const handleCopy = () => {
    const text = lines.join("\n");
    if (text) navigator.clipboard.writeText(text);
  };

  return (
    <div className={CONTENT}>
      <div className={SECTION}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className={SECTION_TITLE}>System log</div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleCopy}
              disabled={lines.length === 0}
              className={`${BTN} ${BTN_SECONDARY} h-8 px-2.5 text-[10px] disabled:opacity-40`}
            >
              Copy
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={lines.length === 0}
              className={`${BTN} ${BTN_SECONDARY} h-8 px-2.5 text-[10px] disabled:opacity-40`}
            >
              Clear
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="h-[calc(100vh-260px)] min-h-[200px] overflow-y-auto overflow-x-auto rounded-xl bg-black/40 border border-white/[0.06] p-2.5 font-mono text-[11px] leading-relaxed scrollbar-modern"
        >
          {lines.length === 0 ? (
            <div className="text-white/30 text-center py-8">No logs yet. Waiting for SYSTEM_LOG messages.</div>
          ) : (
            <div className="space-y-0.5">
              {lines.map((line, i) => (
                <div
                  key={`${i}-${line.slice(0, 20)}`}
                  className="text-white/85 hover:bg-white/[0.04] px-1.5 py-0.5 rounded break-all whitespace-pre-wrap"
                >
                  <span className="text-white/35 select-none mr-2 w-6 inline-block text-right shrink-0">
                    {i + 1}
                  </span>
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="text-[10px] text-white/30 mt-1.5">
          {lines.length} line{lines.length !== 1 ? "s" : ""} (max 2000)
        </div>
      </div>
    </div>
  );
}
