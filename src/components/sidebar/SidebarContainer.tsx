import React, { useCallback, useState } from 'react';
import SidebarPanel from './SidebarPanel';
import SidebarForm from './SidebarForm';
import { FlightControlMenuPanel } from './FlightControlMenuPanel';
import { PanelType } from '../../types';

interface SidebarContainerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogs?: () => void;
  mapServiceRef?: React.MutableRefObject<any>;
  /** קואורדינטות לחיצה אחרונה על המפה — לאותה התנהגות כמו TMAPS-INS ב־Status Bar */
  clickedCoords?: { lat: number; lng: number } | null;
}

function sameClickedCoords(
  a: SidebarContainerProps['clickedCoords'],
  b: SidebarContainerProps['clickedCoords']
): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return a.lat === b.lat && a.lng === b.lng;
}

/** כשהסיידבר סגור — לא מרנדרים מחדש בכל לחיצת מפה (חוסך עבודה ומניע רינדור מיותר של העץ) */
function sidebarContainerPropsEqual(
  prev: SidebarContainerProps,
  next: SidebarContainerProps
): boolean {
  if (!next.isOpen && !prev.isOpen) return true;
  return (
    prev.isOpen === next.isOpen &&
    prev.onClose === next.onClose &&
    prev.onOpenLogs === next.onOpenLogs &&
    sameClickedCoords(prev.clickedCoords, next.clickedCoords)
  );
}

const SidebarContainerInner: React.FC<SidebarContainerProps> = ({ isOpen, onOpenLogs, clickedCoords, mapServiceRef }) => {
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const closeFormPanel = useCallback(() => setActivePanel(null), []);
  React.useEffect(() => {
    if (!isOpen) {
      setActivePanel(null);
    }
  }, [isOpen]);

  const handlePanelSelect = (panelType: PanelType) => {
    if (panelType === 'logs') {
      onOpenLogs?.();
      return;
    }
    if (activePanel === panelType) {
      setActivePanel(null);
    } else {
      setActivePanel(panelType);
    }
  };

  if (!isOpen) return null;
  return (
    <>
      <SidebarPanel
        activePanel={activePanel}
        onPanelSelect={handlePanelSelect}
      />
      {activePanel === 'flightControl' && (
        <FlightControlMenuPanel onClose={closeFormPanel} />
      )}
      {activePanel && activePanel !== 'flightControl' && (
        <SidebarForm
          type={activePanel}
          onClose={closeFormPanel}
          mapServiceRef={mapServiceRef}
          clickedCoords={activePanel === 'location' ? clickedCoords : null}
        />
      )}
    </>
  );
};

const SidebarContainer = React.memo(SidebarContainerInner, sidebarContainerPropsEqual);
export default SidebarContainer;