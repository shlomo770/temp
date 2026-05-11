import { TbTargetArrow } from "react-icons/tb";
import { Target } from '../../store/slices/targetsSlice';

interface TargetActionButtonProps {
  target: Target;
  onClick: (targetId: string) => void;
}

export function TargetActionButton({ target, onClick }: TargetActionButtonProps) {
  const getActionText = (status: string) => {
    switch (status) {
      case 'active':
        return 'הקצעה';
      case 'inactive':
        return 'הפעל';
      case 'disconnected':
        return 'מנותק';
      default:
        return 'הקצעה';
    }
  };

  const getButtonStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-zinc-700/80 hover:bg-white/80';
      case 'inactive':
        return 'bg-green-600/80 hover:bg-green-700/80';
      case 'disconnected':
        return 'bg-red-600/80 hover:bg-red-700/80';
      default:
        return 'bg-blue-600/80 hover:bg-blue-700/80';
    }
  };

  return (
    <button
      onClick={() => onClick(target.id)}
      className={`${getButtonStyle(target.status)} p-2 rounded-lg transition-colors`}
      disabled={target.status === 'disconnected'}
      title={getActionText(target.status)}
    >
      <TbTargetArrow color='red' className="w-4 h-4" />
    </button>
  );
} 