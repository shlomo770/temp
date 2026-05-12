import { Target } from '../../store/slices/targetsSlice';

interface TargetCardCompactProps {
  target: Target;
  isSelected: boolean;
  onSelect: (targetId: string) => void;
}

export function TargetCardCompact({ target, onSelect }: TargetCardCompactProps) {
  const getTargetIcon = (type: string) => {
    return `${type}.svg`
  };

  return (
    <div
      className={`w-[90px] h-14 p-1 m-[2px] [#595959eb] flex flex-col items-center justify-center cursor-pointer transition-all duration-200 border hover:scale-105 hover:shadow-lg rounded-md`}
      onClick={() => onSelect(target.id)}
      title={`${target.id} - ${target.type}`}
    >
      <img
        src={`icons/targets/${getTargetIcon(target.type)}`}
        alt={target.type}
        className="w-6 h-6 mb-1"
        onError={(e) => { const target = e.target as HTMLImageElement; target.src = '/icons/default_unknown_red.png' }} />
      <span className="text-xs text-white font-medium truncate w-full text-center">
        {target.id}
      </span>
    </div>
  );
} 