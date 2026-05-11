import React, { useState } from "react";

type Props = {
  size?: number;       
  label?: string;       
  onClick?: () => void;
  disabled?: boolean;
  gloss?: number;       
};

export const RedRoundButton: React.FC<Props> = ({
  size = 80,
  label = "ביטול",
  onClick,
  disabled = false,
  gloss = 0.55,
}) => {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const S = size;
  const cx = S / 2, cy = S / 2;
  const r  = S * 0.48;

  const base0 = active ? "#ff4a4a" : hover ? "#ff5959" : "#ff6262"; 
  const base1 = active ? "#c91c1c" : hover ? "#d11f1f" : "#db2121"; 
  const base2 = active ? "#7e0d0d" : hover ? "#8a0f0f" : "#951010"; 

  const shadow = disabled
    ? "drop-shadow(0 1px 2px rgba(0,0,0,.25))"
    : active
    ? "drop-shadow(0 1px 1px rgba(0,0,0,.55))"
    : hover
    ? "drop-shadow(0 6px 14px rgba(0,0,0,.45))"
    : "drop-shadow(0 4px 10px rgba(0,0,0,.40))";

  const glossOpacity = Math.max(0, Math.min(1, gloss)) * (disabled ? 0.5 : 1);

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => !disabled && setActive(true)}
      onMouseUp={() => setActive(false)}
      onKeyDown={(e) => { if (!disabled && (e.key === " " || e.key === "Enter")) setActive(true); }}
      onKeyUp={() => setActive(false)}
      disabled={disabled}
      aria-label={label}
      style={{
        width: S,
        height: S,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        borderRadius: "5",
        clipPath: "circle(50%)",
        outline: "none",
        filter: shadow,
        transform: active ? "scale(0.97)" : "scale(1)",
        transition: "transform 80ms ease, filter 120ms ease",
      }}
    >
      <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} role="img">
        <defs>
          <radialGradient id="insetGrad" cx="50%" cy="45%" r="65%">
            <stop offset="0%"   stopColor={base2}/>
            <stop offset="60%"  stopColor={base1}/>
            <stop offset="100%" stopColor={base0}/>
          </radialGradient>

          <filter id="insetShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="b"/>
            <feOffset dx="1" dy="1"/>
            <feComposite in2="b" operator="arithmetic" k2="-1" k3="1" result="inset"/>
            <feMerge>
              <feMergeNode in="inset"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <linearGradient id="glossGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.75"/>
            <stop offset="60%"  stopColor="#ffffff" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
          </linearGradient>

          <mask id="circleMask">
            <rect x="0" y="0" width={S} height={S} fill="black"/>
            <circle cx={cx} cy={cy} r={r} fill="white"/>
          </mask>
        </defs>

        <circle cx={cx} cy={cy} r={r} fill="url(#insetGrad)" filter="url(#insetShadow)" />

        <g mask="url(#circleMask)" opacity={glossOpacity}>
          <ellipse
            cx={cx - S*0.06}
            cy={cy - S*0.20}
            rx={r * 0.78}
            ry={r * 0.42}
            fill="url(#glossGrad)"
          />
        </g>

        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={S * 0.28}
          fontFamily="system-ui, Arial, sans-serif"
          fontWeight={800}
          fill={disabled ? "#ffffffaa" : "#ffffff"}
        >
          {label}
        </text>
      </svg>
    </button>
  );
};