import React, { useLayoutEffect, useEffect, useRef, useState } from 'react';

type Placement = 'top' | 'bottom' | 'left' | 'right';

interface FlyoutMenuProps {
  anchorRef: React.RefObject<HTMLElement>;
  isOpen: boolean;
  placement?: Placement;
  onClose: () => void;
  children: React.ReactNode;
  top?: number;
  left?: number;
  arow?: number;
}

const FlyoutMenu: React.FC<FlyoutMenuProps> = ({
  anchorRef,
  isOpen,
  placement = 'bottom',
  onClose,
  children,
  top,
  left,
  arow,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: top ? top : 0, left: left ? left : 0 });

  useLayoutEffect(() => {
    if (!anchorRef.current || !isOpen) return;
    const rect = anchorRef.current.getBoundingClientRect();
    let calculatedTop = 0;
    let calculatedLeft = 0;
    switch (placement) {
      case 'bottom':
        calculatedTop = top ?? 75.5;
        calculatedLeft = left ?? rect.left + rect.width / 2;
        break;
      case 'top':
        calculatedTop = top ?? rect.top - 8;
        calculatedLeft = left ?? rect.left + rect.width / 2;
        break;
      case 'left':
        calculatedTop = top ?? rect.top + rect.height / 2;
        calculatedLeft = left ?? rect.left - 8;
        break;
      case 'right':
        calculatedTop = top ?? rect.top + rect.height / 2;
        calculatedLeft = left ?? rect.right + 8;
        break;
    }

    setCoords({ top: calculatedTop, left: calculatedLeft });
  }, [anchorRef, isOpen, placement, top, left]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, anchorRef, onClose]);
  if (!isOpen) return null;
  return (
    <div
      ref={menuRef}
      className="fixed z-[999999] bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-2"
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        transform: placement === 'bottom' || placement === 'top' ? 'translateX(-50%)' : 'translateY(-50%)',
        pointerEvents: 'auto',
        zIndex: 999999,
      } as React.CSSProperties}
    >
      <div
        className={`absolute w-3 h-3 rotate-45 bg-zinc-900 border-l border-t border-zinc-700`}
        style={{
          top: placement === 'bottom' ? '-6px' : placement === 'top' ? '100%' : '50%',
          left: arow ? `${arow}px` : placement === 'bottom' || placement === 'top' ? '50%' : placement === 'left' ? '100%' : '-6px',
          transform: placement === 'left' || placement === 'right' ? 'translateY(-50%) rotate(45deg)' : 'translateX(-50%) rotate(45deg)',
        }}
      />
      {children}
    </div>
  );
};

export default FlyoutMenu; 