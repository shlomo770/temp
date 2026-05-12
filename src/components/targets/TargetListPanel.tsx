import { Target, sortByType } from '../../store/slices/targetsSlice';
import { TargetCardCompact } from './TargetCardCompact';
import { TargetCardExpanded } from './TargetCardExpanded';
import { useAppDispatch } from '../../hooks/useAppDispatch';

interface TargetListPanelProps {
  targets: Target[];
  selectedTargetId: string | null;
  viewMode: 'compact' | 'expanded';
  onSelectTarget: (targetId: string) => void;
  onAction: (targetId: string) => void;
  onCenter: (targetId: string) => void;
  onAbort: (targetId: string) => void;
  onToggleViewMode: () => void;
  onClose: () => void;
}

export function TargetListPanel({
  targets,
  selectedTargetId,
  viewMode,
  onSelectTarget,
  onAction,
  onCenter,
  onAbort,
  onToggleViewMode,
}: TargetListPanelProps) {
  !selectedTargetId ? selectedTargetId = targets[0]?.id : selectedTargetId;
  const dispatch = useAppDispatch();
  return (
    <div className="fixed right-0 top-[60px] w-[250px] z-50" data-targets-dock>
      <div className={`overflow-y-auto ${viewMode === 'compact' ? 'max-h-[600px]' : 'max-h-[95vh]'
        }`}>
        {viewMode === 'compact' ? (
          <div>
            <div>
              <TargetCardExpanded
                target={targets[0]}
                onAction={onAction}
                onCenter={onCenter}
                onAbort={onAbort}
              />
              <TargetCardExpanded
                target={targets[1]}
                onAction={onAction}
                onCenter={onCenter}
                onAbort={onAbort}
              />
            </div>

            <div className='bg-[#1f2937d6] m-[2px] flex justify-between rounded-sm'>
              <div className='p-2'>
                <button type="button"
                  onClick={() => dispatch(sortByType())}
                  className="inline-flex items-center gap-2 text-sm font-medium text-white">
                  <svg xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor" aria-hidden="true">
                    <path d="M3 4h18l-7 9v5l-4 2v-7L3 4z" />
                  </svg>
                  <span>Sort by type</span>
                </button>
              </div>
              <div>
                <button
                  onClick={onToggleViewMode}
                  className="p-2 text-white font-extrabold"
                >
                  {viewMode === 'compact' ? '>>' : 'X'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-[2px] mr-[2px]  ">
              {targets.map(target => (
                <div key={target.id} className='bg-[#1f2937d6] flex justify-between rounded-md'>
                  <TargetCardCompact
                    key={target.id}
                    target={target}
                    isSelected={target.id === selectedTargetId}
                    onSelect={onSelectTarget}
                  />
                </div>

              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className='bg-[#1f2937d6] m-2 flex justify-between'>
              <div className='p-2'>
                <button type="button"
                  className="inline-flex items-center gap-2 text-sm font-medium text-white">
                  <svg xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor" aria-hidden="true">
                    <path d="M3 4h18l-7 9v5l-4 2v-7L3 4z" />
                  </svg>
                  <span>מיון לפי סוג</span>
                </button>
              </div>
              <div>
                <button
                  onClick={onToggleViewMode}
                  className="p-2 text-white font-extrabold"
                >
                  X
                </button>
              </div>
            </div>
            {targets.map(target => (
              <TargetCardExpanded
                key={target.id}
                target={target}
                onAction={onAction}
                onCenter={onCenter}
                onAbort={onAbort} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 