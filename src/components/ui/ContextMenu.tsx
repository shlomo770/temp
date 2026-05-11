import { FC } from 'react';
import { Entity } from '../../types';

interface ContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  entityId: string;
  entityName: string;
  entity?: Entity;
  isTarget?: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAttackTarget?: () => void;
  onDesignateTarget?: () => void;
  onToggleFriend?: () => void;
}

const ContextMenu: FC<ContextMenuProps> = ({
  open,
  x,
  y,
  isTarget = false,
  onEdit,
  onDelete,
  onAttackTarget,
  onDesignateTarget,
  onToggleFriend
}) => {
  if (!open) return null;

  return (
    <>
      {isTarget && 
        <div
          className={`fixed z-[999] bg-[#1f2937d6] shadow-xl ${isTarget ? 'p-0' : 'py-2'} ${isTarget ? 'min-w-fit' : 'min-w-32'}`}
          style={{
            left: isTarget ? x : x,
            top: y,
            transform: isTarget ? 'translate(-50%, 50%)' : 'none'
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {isTarget ? (
            <div className="flex gap-2 p-2">
              {onDesignateTarget && (
                <button
                  onPointerDown={onAttackTarget}
                  className="flex flex-col items-center justify-center bg-[#1f2937ab] border font-bold text-[#98a5db] rounded-lg p-4 min-w-[80px] min-h-[80px] transition-colors"
                >
                  <img src="/icons/targets/Target_Point.png" alt="" className='w-11' />
                  <span className="text-xs font-medium">Allocat</span>
                </button>
              )}

              {onToggleFriend && (
                <button
                  onPointerDown={onToggleFriend}
                  className="flex flex-col items-center border justify-center bg-[#1f2937ab] font-bold text-[#98a5db] rounded-lg p-4 min-w-[80px] min-h-[80px] transition-colors"
                >
                  <div className="w-8 h-8 mb-2 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
                      <g transform="scale(0.9) rotate(-45 256 256)">
                        <path d="M466.598 491.65 269.674 9.188a14.769 14.769 0 0 0-27.348 0L45.403 491.65a14.77 14.77 0 0 0 21.502 18.106L256 391.571l189.095 118.184A14.736 14.736 0 0 0 452.92 512a14.767 14.767 0 0 0 13.678-20.35z" fill="#43e55f" />
                        <path d="M445.095 509.755A14.736 14.736 0 0 0 452.92 512a14.77 14.77 0 0 0 13.677-20.351L269.674 9.187A14.77 14.77 0 0 0 256 0v391.571l189.095 118.184z" fill="#2e7d32" />
                      </g>
                    </svg>
                  </div>
                  <span className="text-xs font-medium">Friend</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <button
                onPointerDown={onEdit}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit
              </button>
              <button
                onPointerDown={onDelete}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </>
          )}
        </div>
      }
    </>
  );
};

export default ContextMenu;









