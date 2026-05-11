import { FC } from "react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  activeColor?: string;
  inactiveColor?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * מסלול + ידית — padding אחיד ו־translate שווה למרחק הפנוי כדי שהעיגול לא ייצא מהמסגרת
 */
const sizeMap = {
  sm: {
    track: "h-6 w-12",
    thumb: "h-4 w-4",
    /** (w-12 - 2×px-1) - w-4 = 1.5rem */
    shiftOn: "translate-x-[1.5rem]",
  },
  md: {
    track: "h-8 w-16",
    thumb: "h-6 w-6",
    /** (w-16 - 2×px-1) - w-6 = 2rem */
    shiftOn: "translate-x-[2rem]",
  },
  lg: {
    track: "h-10 w-20",
    thumb: "h-8 w-8",
    /** (w-20 - 2×px-1) - w-8 = 2.5rem */
    shiftOn: "translate-x-[2.5rem]",
  },
} as const;

const ToggleSwitch: FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  activeColor = "bg-sky-500",
  inactiveColor = "bg-gray-600",
  size = "md",
  disabled = false,
  ariaLabel,
}) => {
  const s = sizeMap[size];

  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-checked={checked}
      role="switch"
      className={`
        relative inline-flex shrink-0 items-center rounded-full border border-gray-500/90
        px-1 transition-colors duration-300 ease-in-out overflow-hidden
        ${s.track}
        ${
          checked
            ? `${activeColor} shadow-md shadow-sky-500/40`
            : `${inactiveColor} ${disabled ? "opacity-50" : ""}`
        }
        ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <span
        className={`
          block rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out
          ${s.thumb}
          ${checked ? s.shiftOn : "translate-x-0"}
        `}
      />
    </button>
  );
};

export default ToggleSwitch;
