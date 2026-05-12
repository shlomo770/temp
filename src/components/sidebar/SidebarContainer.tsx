import React, { useState } from 'react';
import SidebarPanel from './SidebarPanel';
import SidebarForm from './SidebarForm';
import { PanelType } from '../../types';

interface SidebarContainerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SidebarContainer: React.FC<SidebarContainerProps> = ({ isOpen }) => {
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  React.useEffect(() => {
    if (!isOpen) {
      setActivePanel(null);
    }
  }, [isOpen]);

  const handlePanelSelect = (panelType: PanelType) => {
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
      {activePanel && (
        <SidebarForm
          type={activePanel}
          onClose={() => setActivePanel(null)}
        />
      )}
    </>
  );
};

export default SidebarContainer; 