import { useAppSelector } from '../../hooks/useAppSelector';
import { AmmoStatus } from '../../store/slices/ammoSlice';

function MissileIconSmall({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-5 h-5 text-white/70 ${className ?? ''}`}
      fill="currentColor"
    >
      <rect x="10" y="4" width="4" height="11" rx="2" />
      <polygon points="12,1 15,5 9,5" />
      <polygon points="10,12 6,16 10,16" />
      <polygon points="14,12 18,16 14,16" />
      <rect x="11" y="15" width="2" height="4" />
    </svg>
  );
}

function Badge({ count, colorClass, title, muted }: { count: number; colorClass: string; title: string; muted?: boolean }) {
  return (
    <span
      className={`inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${muted ? 'bg-white/10 text-white/50' : `text-white ${colorClass}`}`}
      title={title}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function LaunchersBar() {
  const launchers = useAppSelector((state) => state.ammo.launchers);

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 gap-2 flex-wrap justify-center max-w-[calc(100vw-2rem)]">
      {launchers.map((launcher) => {
        const ready = launcher.ammo.filter((a) => a.status === 'green').length;
        const off = launcher.ammo.filter((a) => a.status === 'gray').length;
        const faults = launcher.ammo.filter((a) => a.status === 'red' || a.status === 'yellow').length;
        const num = launcher.name.replace(/\D/g, '') || launcher.id.slice(-1);

        return (
          <div
            key={launcher.id}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-md px-3 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/5">
              <MissileIconSmall />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
                L-{num.padStart(2, '0')}
              </span>
              <div className="flex items-center gap-1.5">
                <Badge
                  count={ready}
                  colorClass="bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.4)]"
                  title="דלוקים / מוכנים"
                  muted={ready === 0}
                />
                <Badge
                  count={off}
                  colorClass="bg-slate-500/80"
                  title="כבויים"
                  muted={off === 0}
                />
                <Badge
                  count={faults}
                  colorClass="bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.35)]"
                  title="תקולים"
                  muted={faults === 0}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
