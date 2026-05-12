import { useMemo, useState, MutableRefObject, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useAppSelector } from '../../hooks/useAppSelector';
import { TargetListPanel } from './TargetListPanel';
import { TargetCardExpanded } from './TargetCardExpanded';
import { Target } from '../../store/slices/targetsSlice';

const TARGETS_DOCK_SELECTOR = '[data-targets-dock]';

interface TargetViewerProps {
  mapServiceRef: MutableRefObject<any>;
  onAttackTarget: (targetId: string) => void;
  onAbortTarget: (targetId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function TargetViewer({ mapServiceRef, onAttackTarget, onAbortTarget, isOpen, onToggle }: TargetViewerProps) {
  const targetsState = useAppSelector(state => state.targets);
  const targets = useMemo(
    () => targetsState.allIds.map(id => targetsState.byId[id]).filter(Boolean),
    [targetsState.allIds, targetsState.byId]
  );

  const [selectedTargetId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>('compact');
  const [cardData, setCardData] = useState<Target | null>(null);
  const [prevCardData, setPrevCardData] = useState<string | null>(null);
  const [isOpenCard, setIsOpenCard] = useState(false);
  const expandedCardRef = useRef<HTMLDivElement>(null);

  const closeExpandedCard = useCallback(() => {
    setIsOpenCard(false);
    setPrevCardData(null);
  }, []);

  useEffect(() => {
    const targetData = targets.find((t) => t.id === prevCardData);
    if (!targetData) {
      setCardData(null);
      setPrevCardData(null);
      setIsOpenCard(false);
      return;
    }
    setCardData(targetData);
  }, [targets, prevCardData]);

  useEffect(() => {
    if (!isOpenCard) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const node = e.target as Node;
      if (expandedCardRef.current?.contains(node)) return;
      const panel = document.querySelector(TARGETS_DOCK_SELECTOR);
      if (panel?.contains(node)) return;
      closeExpandedCard();
    };
    document.addEventListener('mousedown', onDocMouseDown, true);
    return () => document.removeEventListener('mousedown', onDocMouseDown, true);
  }, [isOpenCard, closeExpandedCard]);

  useEffect(() => {
    if (!isOpenCard) return;
    const map = mapServiceRef.current?.getMap?.();
    if (!map) return;
    const onMapClick = () => closeExpandedCard();
    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [isOpenCard, closeExpandedCard, mapServiceRef]);

  useLayoutEffect(() => {
    if (isOpenCard && expandedCardRef.current) {
      expandedCardRef.current.focus({ preventScroll: true });
    }
  }, [isOpenCard, cardData?.id]);

  useEffect(() => {
    if (!isOpenCard) return;
    const el = expandedCardRef.current;
    if (!el) return;
    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as Node | null;
      if (el.contains(next)) return;
      const panel = document.querySelector(TARGETS_DOCK_SELECTOR);
      if (next && panel?.contains(next)) return;
      closeExpandedCard();
    };
    el.addEventListener('focusout', onFocusOut);
    return () => el.removeEventListener('focusout', onFocusOut);
  }, [isOpenCard, cardData?.id, closeExpandedCard]);

  const handleSelectTarget = (targetId: string) => {
    const targetData = targets.find((t) => t.id === targetId);
    if (!targetData) return;
    setCardData(targetData);
    if (targetId === prevCardData) {
      setIsOpenCard(false);
      setPrevCardData(null);
      return;
    }
    setIsOpenCard(true);
    setPrevCardData(targetData.id);
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

  const handleToggleViewMode = () => {
    setViewMode(prev => (prev === 'compact' ? 'expanded' : 'compact'));
  };

  const handleClose = () => {
    onToggle();
  };

  return (
    <>
      {isOpen && (
        <TargetListPanel
          targets={targets}
          selectedTargetId={selectedTargetId}
          viewMode={viewMode}
          onSelectTarget={handleSelectTarget}
          onAction={handleTargetAction}
          onCenter={handleCenterTarget}
          onToggleViewMode={handleToggleViewMode}
          onClose={handleClose}
          onAbort={handleAbortAction}
        />
      )}

      {isOpenCard && cardData && (
        <div
          ref={expandedCardRef}
          className="fixed top-[40%] right-[15%] z-[60] outline-none"
          tabIndex={-1}
          role="dialog"
          aria-label="פרטי מטרה"
        >
          <TargetCardExpanded
            target={cardData}
            onAction={handleTargetAction}
            onCenter={handleCenterTarget}
            onAbort={handleAbortAction}
          />
        </div>
      )}
    </>
  );
}
