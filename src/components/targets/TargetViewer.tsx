import { useMemo, useState, MutableRefObject } from 'react';
import { useAppSelector } from '../../hooks/useAppSelector';
import { TargetListPanel } from './TargetListPanel';


interface TargetViewerProps {
  mapServiceRef: MutableRefObject<any>;
  onAttackTarget: (targetId: string) => void;
  onAbortTarget: (targetId: string) => void;
  isOpen: boolean;
}

export function TargetViewer({ mapServiceRef, onAttackTarget, onAbortTarget, isOpen }: TargetViewerProps) {
  const targetsState = useAppSelector(state => state.targets);
  const targets = useMemo(() =>
    targetsState.allIds.map(id => targetsState.byId[id]).filter(Boolean),
    [targetsState.allIds, targetsState.byId]
  );

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const handleSelectTarget = (targetId: string) => {
    setSelectedTargetId(targetId);
  };

  const handleTargetAction = (targetId: string) => {
    onAttackTarget(targetId);
  };

  const handleAbortAction = (targetId: string) => {
    onAbortTarget(targetId);
  };

  const handleCenterTarget = (targetId: string) => {
    const target = targets.find(t => t.id === targetId);
    if (!target || !mapServiceRef.current) return;

    const map = mapServiceRef.current.getMap();
    if (map) {
      map.flyTo({
        center: [target.coordinates.lng, target.coordinates.lat],
        zoom: 14,
        duration: 1000
      });
    }
  };

  return (
    <>
      {isOpen && (
        <TargetListPanel
          targets={targets}
          selectedTargetId={selectedTargetId}
          onSelectTarget={handleSelectTarget}
          onCenterTarget={handleCenterTarget}
          onAttackTarget={handleTargetAction}
          onAbortTarget={handleAbortAction}
        />
      )}
    </>
  );
} 