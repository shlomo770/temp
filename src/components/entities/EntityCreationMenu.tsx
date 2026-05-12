import React, { FC } from 'react';
import { PiPolygonFill } from "react-icons/pi";
import { FaCircleNotch } from "react-icons/fa";
import { FaEllipsisH, FaChartPie } from 'react-icons/fa';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { setDrawingMode } from '../../store/slices/entitiesSlice';
import FlyoutMenu from '../ui/FlyoutMenu';

interface EntityCreationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement>;
}

const EntityCreationMenu: FC<EntityCreationMenuProps> = ({ isOpen, onClose, anchorRef }) => {
  const dispatch = useAppDispatch();
  const handleCreateEntity = (type: 'circle' | 'polygon' | 'line' | 'ellipse' | 'sector') => {
    const entityType = type === 'ellipse' ? 'ellipse' : type;
    dispatch(setDrawingMode(entityType as any));
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
      onClose={onClose}>
      <div
        className="bg-zinc-800 text-white text-sm p-1 rounded shadow-lg min-w-[200px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center gap-4">
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
            title="Create Sector">
            <FaChartPie size={20} className="text-white" />
            <span className="text-xs">Sector</span>
          </div>
        </div>
      </div>
    </FlyoutMenu>
  );
};

export default EntityCreationMenu; 