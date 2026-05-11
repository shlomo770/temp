import React from 'react';
import { GiRadarSweep } from 'react-icons/gi';
import { IoWarningOutline } from 'react-icons/io5';
import { FiZap, FiFileText, FiNavigation, FiCode, FiTerminal } from 'react-icons/fi';
import { MdTerrain } from 'react-icons/md';
import { PanelType } from '../../types';

interface SidebarPanelProps {
  activePanel: PanelType;
  onPanelSelect: (panelType: PanelType) => void;
}

interface SidebarItem {
  key: PanelType;
  icon: React.ReactNode;
  label: string;
}

const SidebarPanel: React.FC<SidebarPanelProps> = ({ activePanel, onPanelSelect }) => {
  const sidebarItems: SidebarItem[] = [
    { key: 'radar', icon: <GiRadarSweep size={24} />, label: 'Radar' },
    { key: 'failures', icon: <IoWarningOutline size={24} />, label: 'Failures' },
    { key: 'flightControl', icon: <FiZap size={24} />, label: 'Flight Control' },
    { key: 'terrain', icon: <MdTerrain size={22} />, label: 'Terrain' },
    { key: 'logs', icon: <FiFileText size={22} />, label: 'Logs' },
    { key: 'location', icon: <FiNavigation size={22} />, label: 'מיקום' },
    { key: 'xmlSend', icon: <FiCode size={22} />, label: 'XML' },
    { key: 'serverMessages', icon: <FiTerminal size={22} />, label: 'BIT' },
  ];

  return (
    <div className="fixed left-0 top-[60px] h-full w-16 bg-[#1e1e1ee0] shadow-lg z-50 flex flex-col items-center justify-start gap-6 pt-6">
      {sidebarItems.map((item) => (
        <button
          key={item.key}
          onClick={() => onPanelSelect(item.key)}
          className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:scale-110 group ${activePanel === item.key
              ? 'text-white bg-[#3a3a3a]'
              : 'text-gray-400 hover:text-white'
            }`}
        >
          <div className="w-8 h-8 flex items-center justify-center">
            {item.icon}
          </div>
          <span className="text-xs font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default SidebarPanel; 