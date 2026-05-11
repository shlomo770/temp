import { Target } from '../../store/slices/targetsSlice';

interface TargetCardCompactProps {
  target: Target;
  isSelected: boolean;
  onSelect: (targetId: string, anchor: { x: number; y: number }) => void;
}

export function TargetCardCompact({ target, isSelected, onSelect }: TargetCardCompactProps) {
  const getTargetIcon = (type: string) => {
    return `${type}.svg`
  };

  return (
    <div
      className={`w-[90px] h-16 p-1 m-[2px] flex flex-col items-center justify-center cursor-pointer transition-all duration-200 border hover:scale-105 hover:shadow-lg rounded-md bg-[#1f2937d6] ${isSelected ? "border-yellow-400 shadow-lg" : "border-transparent"}`}
      onClick={(e) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        onSelect(target.id, { x: rect.left + rect.width / 2, y: rect.top });
      }}
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