import React, { FC, useState } from 'react';
import { PiPolygonFill } from "react-icons/pi";
import { FaCircleNotch, FaMapMarkerAlt } from "react-icons/fa";
import { FaEllipsisH, FaChartPie } from 'react-icons/fa';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { setDrawingMode, setSelectedMarkerIcon } from '../../store/slices/entitiesSlice';
import { setMode } from "../../store/slices/drawSlice";
import FlyoutMenu from '../ui/FlyoutMenu';
import { MARKER_ICONS, getMarkerIconChar } from '../../constants/markerIcons';

interface EntityCreationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
}

const EntityCreationMenu: FC<EntityCreationMenuProps> = ({ isOpen, onClose, anchorRef }) => {
  const dispatch = useAppDispatch();
  const [showIconPicker, setShowIconPicker] = useState(false);
  const selectedIcon = useAppSelector((s) => s.entities.selectedMarkerIcon);

  const handleCreateEntity = (type: 'circle' | 'polygon' | 'line' | 'ellipse' | 'sector') => {
    const entityType = type === 'ellipse' ? 'ellipse' : type;
    dispatch(setDrawingMode(entityType as any));
    dispatch(setMode(type as any));
    dispatch(setSelectedMarkerIcon(null));
    onClose();
  };

  const handleCreateMarker = (iconCode: string) => {
    dispatch(setSelectedMarkerIcon(iconCode));
    dispatch(setDrawingMode('marker'));
    dispatch(setMode('marker' as any));
    setShowIconPicker(false);
    onClose();
  };

  return (
    <FlyoutMenu
      anchorRef={anchorRef}
      isOpen={isOpen}
      placement="right"
      top={880}
      left={110}
      arow={0}
      onClose={() => { setShowIconPicker(false); onClose(); }}>
      <div
        className="bg-zinc-800 text-white text-sm p-1 rounded shadow-lg min-w-[200px]"
        onClick={(e) => e.stopPropagation()}>
        {!showIconPicker ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div
                className="flex flex-col items-center gap-1 p-1 rounded hover:bg-zinc-700 cursor-pointer transition-colors"
                onClick={(e) => { e.stopPropagation(); handleCreateEntity('circle'); }}
                title="Create Circle">
                <FaCircleNotch size={20} className="text-white" />
                <span className="text-xs">Circle</span>
              </div>
              <div
                className="flex flex-col items-center gap-1 p-1 rounded hover:bg-zinc-700 cursor-pointer transition-colors"
                onClick={(e) => { e.stopPropagation(); handleCreateEntity('polygon'); }}
                title="Create Polygon">
                <PiPolygonFill size={20} className="text-white" />
                <span className="text-xs">Polygon</span>
              </div>
              <div
                className="flex flex-col items-center gap-1 p-1 rounded hover:bg-zinc-700 cursor-pointer transition-colors"
                onClick={(e) => { e.stopPropagation(); handleCreateEntity('ellipse'); }}
                title="Create Ellipse">
                <FaEllipsisH size={20} className="text-white" />
                <span className="text-xs">Ellipse</span>
              </div>
              <div
                className="flex flex-col items-center gap-1 p-1 rounded hover:bg-zinc-700 cursor-pointer transition-colors"
                onClick={(e) => { e.stopPropagation(); handleCreateEntity('sector'); }}
                title="Create Tabbozon">
                <FaChartPie size={20} className="text-white" />
                <span className="text-xs">Tabbozon</span>
              </div>
            </div>
            <div className="border-t border-zinc-600 mt-1 pt-1">
              <div
                className="flex flex-col items-center gap-1 p-2 rounded hover:bg-zinc-700 cursor-pointer transition-colors"
                onClick={(e) => { e.stopPropagation(); setShowIconPicker(true); }}
                title="Create Point (choose icon)">
                <FaMapMarkerAlt size={20} className="text-white" />
                <span className="text-xs">Point</span>
                {selectedIcon && <span className="text-[10px] text-zinc-400">Icon selected</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-zinc-600 pb-1">
              <span className="text-xs font-medium">Choose icon for point</span>
              <button
                type="button"
                className="text-zinc-400 hover:text-white text-xs"
                onClick={(e) => { e.stopPropagation(); setShowIconPicker(false); }}>
                Back
              </button>
            </div>
            <div className="grid grid-cols-5 gap-1 max-h-[220px] overflow-y-auto">
              {MARKER_ICONS.map(({ code, label, font }) => (
                <div
                  key={code}
                  className="flex flex-col items-center gap-0.5 p-1.5 rounded hover:bg-zinc-700 cursor-pointer transition-colors border border-transparent hover:border-zinc-500"
                  onClick={(e) => { e.stopPropagation(); handleCreateMarker(code); }}
                  title={label}>
                  <span
                    className="text-xl w-8 h-8 flex items-center justify-center"
                    style={{ fontFamily: `${font}, sans-serif` }}>
                    {getMarkerIconChar(code)}
                  </span>
                  <span className="text-[10px] truncate max-w-full">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </FlyoutMenu>
  );
};

export default EntityCreationMenu;
