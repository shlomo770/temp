import { useAppSelector } from '../../hooks/useAppSelector';
import { AmmoStatus } from '../../store/slices/ammoSlice';

export function AmmoStatusPanel() {
  const launchers = useAppSelector(state => state.ammo.launchers);

  const statusColors: Record<AmmoStatus, string> = {
    green: '#34d399',
    yellow: '#fbbf24',
    red: '#ef4444',
    gray: '#94a3b8',
  };

  const glowStatuses: AmmoStatus[] = ['green', 'yellow', 'red'];

  // 🔹 Missile Icon — Bigger
  const MissileIcon = ({
    color,
    glow,
  }: {
    color: string;
    glow?: boolean;
  }) => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      className={
        glow
          ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]'
          : ''
      }
    >
      {/* גוף */}
      <rect x="10" y="4" width="4" height="11" rx="2" fill={color} />

      {/* ראש */}
      <polygon points="12,1 15,5 9,5" fill={color} />

      {/* כנפיים */}
      <polygon points="10,12 6,16 10,16" fill={color} />
      <polygon points="14,12 18,16 14,16" fill={color} />

      {/* זנב */}
      <rect x="11" y="15" width="2" height="4" fill={color} />
    </svg>
  );

  return (
    <div className="fixed right-4 top-[10%] z-50">

      {/* GRID 2×3 */}
      <div className="grid grid-cols-2 gap-3">

        {launchers.map((launcher) => (
          <div
            key={launcher.id}
            className="
              relative
              rounded-xl
              bg-gradient-to-b
              from-[#0b1220cc]
              to-[#0b1220ee]
              backdrop-blur-md
              px-3
              py-3
              border border-white/10
              shadow-[inset_0_1px_6px_rgba(255,255,255,0.06)]
            "
          >
            {/* HEADER */}
            <div className="text-[12px] text-white/90 text-center pb-2 tracking-widest font-semibold">
              L-{launcher.name.replace('משגר ', '').padStart(2, '0')}
            </div>

            {/* AMMO GRID */}
            <div className="grid grid-cols-4 gap-[6px] justify-items-center">

              {launcher.ammo.map((item) => (
                <MissileIcon
                  key={item.id}
                  color={statusColors[item.status]}
                  glow={glowStatuses.includes(item.status)}
                />
              ))}

            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
