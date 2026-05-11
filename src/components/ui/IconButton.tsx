import React, { useState } from "react";

type Props = {
  src: string;         
  size?: number;        
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  hoverScale?: number;   
  activeScale?: number; 
  shadow?: boolean;      
};

export const ImageButtonGhost: React.FC<Props> = ({
  src,
  size = 96,
  onClick,
  disabled = false,
  ariaLabel,
  hoverScale = 1.03,
  activeScale = 0.97,
  shadow = true,
}) => {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const baseFilter = shadow
    ? disabled
      ? "drop-shadow(0 1px 2px rgba(0,0,0,.25))"
      : hover
        ? "drop-shadow(0 6px 14px rgba(0,0,0,.45))"
        : "drop-shadow(0 4px 10px rgba(0,0,0,.40))"
    : "none";

  const scale = active ? activeScale : hover ? hoverScale : 1;

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(false);
      }}
      onMouseDown={() => !disabled && setActive(true)}
      onMouseUp={() => setActive(false)}
      onKeyDown={(e) => {
        if (!disabled && (e.key === " " || e.key === "Enter")) setActive(true);
      }}
      onKeyUp={() => setActive(false)}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        lineHeight: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        outline: "none",
        transform: `scale(${scale})`,
        transition: "transform 90ms ease, filter 140ms ease",
        filter: baseFilter,
        marginTop: '10px'
      }}
    >
      <img
        src={src}
        alt={ariaLabel || "button-icon"}
        width={size}
        height={size}
        style={{
          display: "block",
          opacity: disabled ? 0.5 : 1,
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
    </button>
  );
};