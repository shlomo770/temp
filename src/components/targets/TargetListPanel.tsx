import { useEffect, useMemo, useRef, useState } from 'react';
import { Target, sortByType } from '../../store/slices/targetsSlice';
import { useAppDispatch } from '../../hooks/useAppDispatch';

interface TargetListPanelProps {
  targets: Target[];
  selectedTargetId: string | null;
  onSelectTarget: (targetId: string) => void;
  onCenterTarget: (targetId: string) => void;
  onAttackTarget: (targetId: string) => void;
  onAbortTarget: (targetId: string) => void;
}

export function TargetListPanel({
  targets,
  selectedTargetId,
  onSelectTarget,
  onCenterTarget,
  onAttackTarget,
  onAbortTarget,
}: TargetListPanelProps) {

  const dispatch = useAppDispatch();
  const panelRef = useRef<HTMLDivElement | null>(null);

  // =========================
  // Drag
  // =========================
  const dragRef = useRef({
    offsetX: 0,
    offsetY: 0,
    active: false,
  });

  // =========================
  // Resize
  // =========================
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    dir: 'horizontal' | 'vertical' | 'both' | null;
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
  const MIN_H = 180;
  const [pos, setPos] = useState({ x: 120, y: 400 });
  const [size, setSize] = useState({ w: MIN_W, h: MIN_H });

  const [sortKey, setSortKey] =
    useState<'id' | 'type' | 'status' | 'speed' | 'alt'>('id');

  const [sortDir, setSortDir] =
    useState<'asc' | 'desc'>('asc');

  // =========================
  // Init Position — תמיד בצד שמאל, משתמש יכול להזיז/להגדיל בגרירה
  // =========================
  const LEFT_MARGIN = 24;
  const BOTTOM_MARGIN = 24;
  useEffect(() => {
    setSize({ w: MIN_W, h: MIN_H });
    setPos({
      x: LEFT_MARGIN,
      y: Math.max(10, Math.round(window.innerHeight - MIN_H - BOTTOM_MARGIN)),
    });
  }, []);

  // =========================
  // Sorting
  // =========================
  const sortedTargets = useMemo(() => {
    const copy = [...targets];

    const getAlt = (t: Target) =>
      Number(t.coordinates?.alt ?? 0);

    const getSpeed = (t: Target) =>
      Number(t.speed ?? 0);

    copy.sort((a, b) => {
      let v = 0;

      if (sortKey === 'id')
        v = String(a.id).localeCompare(String(b.id));

      if (sortKey === 'type')
        v = String(a.type).localeCompare(String(b.type));

      if (sortKey === 'status')
        v = String(a.status).localeCompare(String(b.status));

      if (sortKey === 'speed')
        v = getSpeed(a) - getSpeed(b);

      if (sortKey === 'alt')
        v = getAlt(a) - getAlt(b);

      return sortDir === 'asc' ? v : -v;
    });

    return copy;
  }, [targets, sortKey, sortDir]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir(p => (p === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortArrow = (key: typeof sortKey) =>
    sortKey === key ? (sortDir === 'asc' ? '▲' : '▼') : '';

  // =========================
  // Pointer Move
  // =========================
  useEffect(() => {
    const move = (e: PointerEvent) => {

      // Drag
      if (dragRef.current.active) {
        const x = e.clientX - dragRef.current.offsetX;
        const y = e.clientY - dragRef.current.offsetY;

        setPos({
          x: Math.max(10, x),
          y: Math.max(10, y),
        });
      }

      // Resize
      if (resizeRef.current.active) {

        const dx = e.clientX - resizeRef.current.startX;
        const dy = e.clientY - resizeRef.current.startY;

        setSize({
          w:
            resizeRef.current.dir === 'vertical'
              ? resizeRef.current.startW
              : Math.max(MIN_W, resizeRef.current.startW + dx),

          h:
            resizeRef.current.dir === 'horizontal'
              ? resizeRef.current.startH
              : Math.max(MIN_H, resizeRef.current.startH + dy),
        });
      }
    };

    const up = () => {
      dragRef.current.active = false;
      resizeRef.current.active = false;
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);

    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  // =========================
  // Drag Start
  // =========================
  const handleDragStart = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    const rect =
      panelRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragRef.current = {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      active: true,
    };
  };

  // =========================
  // Resize Start
  // =========================
  const handleResizeStart = (
    x: number,
    y: number,
    dir: 'horizontal' | 'vertical' | 'both'
  ) => {
    resizeRef.current = {
      startX: x,
      startY: y,
      startW: size.w,
      startH: size.h,
      dir,
      active: true,
    };
  };

  const shouldAbort = (target: Target) =>
    target.status === 'allocated' ||
    target.status === 'designated' ||
    target.status === 'track' ||
    target.status === 'arm';

  // =========================
  // Render
  // =========================
  return (
    <div
      ref={panelRef}
      className="fixed z-50 overflow-hidden"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
      }}
    >
      <div className="h-full flex flex-col rounded-md bg-[#0b1220cc] border border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.35)]">

        {/* Header */}
        <div
          className="flex items-center gap-2 px-2 py-1 border-b border-white/10 cursor-move select-none"
          onPointerDown={handleDragStart}
        >
          <button
            onClick={() => dispatch(sortByType())}
            className="text-[10px] text-white/90 px-2 py-1 hover:bg-white/10"
          >
            Sort by type
          </button>

          <div className="text-[11px] text-white/60">
            Total: {targets.length}
          </div>
        </div>

        {/* Table */}
        <div
          className="flex-1 overflow-y-auto scrollbar-modern"
          style={{
            maxHeight: Math.max(140, size.h - 46),
          }}
        >
          <table className="w-full text-[12px] text-white/90">
            <thead className="sticky top-0 bg-[#0b1220] text-white/70">
              <tr>
                <th className="px-3 py-2 text-left">
                  <button onClick={() => toggleSort('id')}>
                    ID {sortArrow('id')}
                  </button>
                </th>

                <th className="px-3 py-2 text-left">
                  <button onClick={() => toggleSort('type')}>
                    Type {sortArrow('type')}
                  </button>
                </th>

                <th className="px-3 py-2 text-left">
                  <button onClick={() => toggleSort('status')}>
                    Status {sortArrow('status')}
                  </button>
                </th>

                <th className="px-3 py-2 text-left">
                  <button onClick={() => toggleSort('speed')}>
                    Speed {sortArrow('speed')}
                  </button>
                </th>

                <th className="px-3 py-2 text-left">
                  <button onClick={() => toggleSort('alt')}>
                    Alt {sortArrow('alt')}
                  </button>
                </th>

                <th className="px-3 py-2 text-left">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedTargets.map(target => {
                const showAbort =
                  shouldAbort(target);

                return (
                  <tr
                    key={target.id}
                    className="border-t border-white/5 hover:bg-white/5 cursor-pointer"
                    onClick={() => {
                      onSelectTarget(target.id);
                      onCenterTarget(target.id);
                    }}
                  >
                    <td className="px-3 py-2 font-mono">
                      {target.id}
                    </td>

                    <td className="px-3 py-2">
                      {target.type}
                    </td>

                    <td className="px-3 py-2">
                      {target.status}
                    </td>

                    <td className="px-3 py-2">
                      {target.speed ?? '-'}
                    </td>

                    <td className="px-3 py-2">
                      {target.coordinates?.alt ?? '-'}
                    </td>

                    <td className="px-3 py-2">
                      <button
                        className={`px-2 py-1 rounded text-[11px] ${
                          showAbort
                            ? 'bg-red-600/70'
                            : 'bg-green-600/70'
                        }`}
                        onClick={e => {
                          e.stopPropagation();

                          if (showAbort)
                            onAbortTarget(target.id);
                          else
                            onAttackTarget(target.id);
                        }}
                      >
                        {showAbort ? 'Abort' : 'Assign'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resize Right */}
      <div
        className="absolute right-0 top-0 h-full w-2 cursor-ew-resize"
        onPointerDown={e =>
          handleResizeStart(
            e.clientX,
            e.clientY,
            'horizontal'
          )
        }
      />

      {/* Resize Bottom */}
      <div
        className="absolute left-0 bottom-0 w-full h-2 cursor-ns-resize"
        onPointerDown={e =>
          handleResizeStart(
            e.clientX,
            e.clientY,
            'vertical'
          )
        }
      />

      {/* Resize Corner Invisible */}
      <div
        className="absolute right-0 bottom-0 h-4 w-4 cursor-se-resize"
        onPointerDown={e =>
          handleResizeStart(
            e.clientX,
            e.clientY,
            'both'
          )
        }
      />
    </div>
  );
}
