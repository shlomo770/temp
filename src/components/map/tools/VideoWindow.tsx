import { useEffect, useRef, useState } from "react";
import JSMpeg from "@cycjimmy/jsmpeg-player";
import { IoClose } from "react-icons/io5";

const MIN_W = 320;
const MIN_H = 200;
const DEFAULT_W = 480;
const DEFAULT_H = 320;

interface VideoWindowProps {
  wsUrl?: string;
  isOpen: boolean;
  onClose?: () => void;
}

export default function VideoWindow({
  wsUrl = "ws://localhost:9001",
  isOpen,
  onClose,
}: VideoWindowProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [pos, setPos] = useState({ x: 24, y: 100 });
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const dragRef = useRef({ active: false, ox: 0, oy: 0 });
  const resizeRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0,
  });

  useEffect(() => {
    if (!isOpen) {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      setLoading(true);
      return;
    }
    if (!canvasRef.current) return;
    const player = new JSMpeg.Player(wsUrl, {
      canvas: canvasRef.current,
      autoplay: true,
      audio: false,
      loop: true,
      onVideoDecode: () => setLoading(false),
    });
    playerRef.current = player;
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isOpen, wsUrl]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (dragRef.current.active) {
        let x = e.clientX - dragRef.current.ox;
        let y = e.clientY - dragRef.current.oy;
        x = Math.max(0, Math.min(x, typeof window !== "undefined" ? window.innerWidth - size.w : x));
        y = Math.max(0, Math.min(y, typeof window !== "undefined" ? window.innerHeight - 48 : y));
        setPos({ x, y });
      }
      if (resizeRef.current.active) {
        const dx = e.clientX - resizeRef.current.startX;
        const dy = e.clientY - resizeRef.current.startY;
        setSize({
          w: Math.max(MIN_W, resizeRef.current.startW + dx),
          h: Math.max(MIN_H, resizeRef.current.startH + dy),
        });
      }
    };
    const up = () => {
      dragRef.current.active = false;
      resizeRef.current.active = false;
    };
    const opts = { capture: true };
    document.addEventListener("pointermove", move, opts);
    document.addEventListener("pointerup", up, opts);
    document.addEventListener("pointercancel", up, opts);
    return () => {
      document.removeEventListener("pointermove", move, opts);
      document.removeEventListener("pointerup", up, opts);
      document.removeEventListener("pointercancel", up, opts);
    };
  }, [size.w, size.h]);

  const onDragStart = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      active: true,
      ox: e.clientX - pos.x,
      oy: e.clientY - pos.y,
    };
  };

  const onResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startW: size.w,
      startH: size.h,
    };
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
        minWidth: MIN_W,
        minHeight: MIN_H,
      }}
    >
      {/* Header — גרירה + סגירה */}
      <div
        onPointerDown={onDragStart}
        className="flex cursor-move select-none items-center justify-between border-b border-white/10 bg-slate-800/80 px-3 py-2"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
          Video Stream
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close"
          >
            <IoClose size={18} />
          </button>
        )}
      </div>

      {/* תוכן — וידאו */}
      <div className="relative flex-1 min-h-0 bg-black/50">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10">
            <div className="w-10 h-10 border-2 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Resize handle — פינה ימין תחתון, גדול וברור */}
      <div
        onPointerDown={onResizeStart}
        className="absolute bottom-0 right-0 z-20 w-10 h-10 cursor-se-resize flex items-end justify-end rounded-tl-lg bg-slate-800/80 border-t border-l border-white/10 pointer-events-auto"
        aria-label="Resize"
      >
        <svg
          className="w-5 h-5 text-white/50 hover:text-white/80 m-1"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M21 21H3v-2h16v-2h2v4zM3 11h2v2H3v-2zm4 0h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" />
        </svg>
      </div>
    </div>
  );
}
