import { useEffect, useMemo, useRef, useState } from "react";
import { useAppSelector } from "../../hooks/useAppSelector";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { clearLogs } from "../../store/slices/logsSlice";

interface LogsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogsPanel({ isOpen, onClose }: LogsPanelProps) {
  const lines = useAppSelector((s) => s.logs.lines);
  const dispatch = useAppDispatch();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const dragRef = useRef({
    offsetX: 0,
    offsetY: 0,
    active: false,
  });

  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    dir: "horizontal" | "vertical" | "both" | null;
    active: boolean;
  }>({
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0,
    dir: null,
    active: false,
  });

  const MIN_W = 520;
  const MIN_H = 220;
  const [pos, setPos] = useState({ x: 120, y: 120 });
  const [size, setSize] = useState({ w: MIN_W, h: MIN_H });
  const [query, setQuery] = useState("");
  const [showOnlyMatches, setShowOnlyMatches] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const LEFT_MARGIN = 24;
    const TOP_MARGIN = 80;
    setSize({ w: MIN_W, h: MIN_H });
    setPos({
      x: LEFT_MARGIN,
      y: TOP_MARGIN,
    });
  }, [isOpen]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  const filteredLines = useMemo(() => {
    if (!query.trim()) return lines;
    const q = query.toLowerCase();
    if (showOnlyMatches) {
      return lines.filter((l) => l.toLowerCase().includes(q));
    }
    return lines;
  }, [lines, query, showOnlyMatches]);

  const handleMouseDownDrag = (e: React.MouseEvent) => {
    if (!panelRef.current) return;
    dragRef.current.active = true;
    const rect = panelRef.current.getBoundingClientRect();
    dragRef.current.offsetX = e.clientX - rect.left;
    dragRef.current.offsetY = e.clientY - rect.top;
    window.addEventListener("mousemove", handleMouseMoveDrag);
    window.addEventListener("mouseup", handleMouseUpDrag);
  };

  const handleMouseMoveDrag = (e: MouseEvent) => {
    if (!dragRef.current.active) return;
    setPos((prev) => ({
      x: e.clientX - dragRef.current.offsetX,
      y: e.clientY - dragRef.current.offsetY,
    }));
  };

  const handleMouseUpDrag = () => {
    dragRef.current.active = false;
    window.removeEventListener("mousemove", handleMouseMoveDrag);
    window.removeEventListener("mouseup", handleMouseUpDrag);
  };

  const startResize = (
    e: React.MouseEvent,
    dir: "horizontal" | "vertical" | "both"
  ) => {
    if (!panelRef.current) return;
    e.stopPropagation();
    const rect = panelRef.current.getBoundingClientRect();
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: rect.width,
      startH: rect.height,
      dir,
      active: true,
    };
    window.addEventListener("mousemove", handleResizeMove);
    window.addEventListener("mouseup", handleResizeUp);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizeRef.current.active) return;
    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;

    setSize((prev) => {
      let w = prev.w;
      let h = prev.h;
      if (resizeRef.current.dir === "horizontal" || resizeRef.current.dir === "both") {
        w = Math.max(MIN_W, resizeRef.current.startW + dx);
      }
      if (resizeRef.current.dir === "vertical" || resizeRef.current.dir === "both") {
        h = Math.max(MIN_H, resizeRef.current.startH + dy);
      }
      return { w, h };
    });
  };

  const handleResizeUp = () => {
    resizeRef.current.active = false;
    window.removeEventListener("mousemove", handleResizeMove);
    window.removeEventListener("mouseup", handleResizeUp);
  };

  const handleClear = () => dispatch(clearLogs());
  const handleCopy = () => {
    const source = filteredLines.length > 0 ? filteredLines : lines;
    const text = source.join("\n");
    if (text) navigator.clipboard.writeText(text);
  };

  const visible = isOpen;

  if (!visible) return null;

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
        zIndex: 10000,
      }}
      className="bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden select-none"
    >
      <div
        className="h-9 px-3 flex items-center justify-between gap-2 bg-slate-800/90 border-b border-white/10"
      >
        <div
          className="flex items-center gap-2 cursor-move"
          onMouseDown={handleMouseDownDrag}
        >
          <div className="text-[11px] font-semibold tracking-widest uppercase text-white/70">
            System log
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="h-7 w-40 rounded-md border border-white/20 bg-black/30 px-2 text-[10px] text-white placeholder-white/35 focus:outline-none focus:ring-1 focus:ring-emerald-400/60"
          />
          <label className="flex items-center gap-1 text-[10px] text-white/60 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showOnlyMatches}
              onChange={(e) => setShowOnlyMatches(e.target.checked)}
              className="w-3 h-3 rounded border border-white/40 bg-black/40"
            />
            Only matches
          </label>
          <button
            type="button"
            onClick={handleCopy}
            disabled={lines.length === 0}
            className="h-7 px-2 rounded-md text-[10px] font-medium bg-white/10 text-white hover:bg-white/15 disabled:opacity-40"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={lines.length === 0}
            className="h-7 px-2 rounded-md text-[10px] font-medium bg-white/5 text-white hover:bg-white/10 disabled:opacity-40"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-md text-[12px] font-bold bg-rose-600/90 text-white hover:bg-rose-500/90 flex items-center justify-center"
          >
            ×
          </button>
        </div>
      </div>
      <div className="flex-1 relative bg-slate-950/80">
        <div
          ref={scrollRef}
          className="absolute inset-0 overflow-y-auto overflow-x-auto p-2.5 font-mono text-[11px] leading-relaxed scrollbar-modern"
        >
          {lines.length === 0 ? (
            <div className="text-white/30 text-center py-8">
              No logs yet. Waiting for SYSTEM_LOG messages.
            </div>
          ) : (
            <div className="space-y-0.5">
              {lines.map((line, i) => {
                const q = query.trim().toLowerCase();
                const isMatch = q && line.toLowerCase().includes(q);
                if (showOnlyMatches && q && !isMatch) return null;
                return (
                <div
                  key={`${i}-${line.slice(0, 20)}`}
                  className={`text-white/85 px-1.5 py-0.5 rounded break-all whitespace-pre-wrap ${
                    isMatch ? "bg-emerald-500/20" : "hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="text-white/35 select-none mr-2 w-6 inline-block text-right shrink-0">
                    {i + 1}
                  </span>
                  {line}
                </div>
              );
              })}
            </div>
          )}
        </div>
        <div
          onMouseDown={(e) => startResize(e, "both")}
          className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize bg-transparent"
        />
        <div
          onMouseDown={(e) => startResize(e, "horizontal")}
          className="absolute right-0 top-0 w-1 h-full cursor-e-resize bg-transparent"
        />
        <div
          onMouseDown={(e) => startResize(e, "vertical")}
          className="absolute left-0 bottom-0 w-full h-1 cursor-n-resize bg-transparent"
        />
      </div>
      <div className="h-6 px-3 flex items-center justify-between text-[10px] text-white/35 bg-slate-900/95 border-t border-white/10">
        <span>
          {lines.length} line{lines.length !== 1 ? "s" : ""} (max 2000)
        </span>
      </div>
    </div>
  );
}

