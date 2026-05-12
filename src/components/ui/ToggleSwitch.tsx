import {FC} from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  activeColor?: string;
  inactiveColor?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  ariaLabel?: string;
}

const ToggleSwitch: FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  activeColor = 'bg-sky-500',
  inactiveColor = 'bg-gray-600',
  size = 'md',
  disabled = false,
  ariaLabel,
}) => {
  const sizeMap = {
    sm: { 
      outer: 'h-6 w-12', 
      inner: 'h-4 w-4 translate-x-1', 
      translate: 'translate-x-7',
      shadow: 'shadow-sm'
    },
    md: { 
      outer: 'h-8 w-16', 
      inner: 'h-6 w-6 translate-x-1', 
      translate: 'translate-x-9',
      shadow: 'shadow-md'
    },
    lg: { 
      outer: 'h-10 w-20', 
      inner: 'h-8 w-8 translate-x-1', 
      translate: 'translate-x-11',
      shadow: 'shadow-lg'
    },
  };

  const { outer, inner, translate, shadow } = sizeMap[size];

  return (
    <button
      onClick={onChange}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-checked={checked}
      role="switch"
      className={`relative inline-flex ${outer} items-center rounded-full transition-all duration-300 ease-in-out border border-[#919191] ${
        checked 
          ? `${activeColor} shadow-lg shadow-sky-500/50` 
          : `${inactiveColor} ${disabled ? 'opacity-50' : ''}`
      } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block ${inner} transform rounded-full bg-white ${shadow} transition-all duration-300 ease-in-out ${
          checked ? translate : 'translate-x-1'
        }`}
      />
    </button>
  );
};

export default ToggleSwitch; 