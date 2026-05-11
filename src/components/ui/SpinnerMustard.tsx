type Props = { size?: number; stroke?: number; color?: string; className?: string };

export default function SpinnerMustard({ size = 28, stroke = 3, color = "#facc15", className = "" }: Props) {
  const r = (size / 2) - stroke;
  const c = 2 * Math.PI * r;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`cg-spin ${className}`}
      style={{ display: "inline-block" }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={stroke}
        opacity="0.6"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={stroke}
        strokeDasharray={`${c * 0.25} ${c}`}
        strokeDashoffset={0}
      />
      <style>{`
        .cg-spin { animation: cg-rotate 1s linear infinite; }
        @keyframes cg-rotate { to { transform: rotate(360deg); } }
      `}</style>
    </svg>
  );
}