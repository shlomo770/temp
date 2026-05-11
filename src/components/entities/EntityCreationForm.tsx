import React, { FC, useState } from 'react';
import { PiPolygonFill } from "react-icons/pi";
import { FaCircleNotch, FaMapMarkerAlt } from "react-icons/fa";
import { FaEllipsisH, FaChartPie } from 'react-icons/fa';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { setDrawingMode, setSelectedMarkerIcon } from '../../store/slices/entitiesSlice';
import { setMode } from "../../store/slices/drawSlice";
import { MARKER_ICONS, getMarkerIconChar } from '../../constants/markerIcons';

const EntityCreationForm: FC = () => {
  const dispatch = useAppDispatch();
  const [showIconPicker, setShowIconPicker] = useState(false);
  const selectedIcon = useAppSelector((s) => s.entities.selectedMarkerIcon);

  const handleCreateEntity = (type: 'circle' | 'polygon' | 'line' | 'ellipse' | 'sector') => {
    const entityType = type === 'ellipse' ? 'ellipse' : type;
    dispatch(setDrawingMode(entityType as any));
    dispatch(setMode(type as any));
    dispatch(setSelectedMarkerIcon(null));
  };

  const handleCreateMarker = (iconCode: string) => {
    dispatch(setSelectedMarkerIcon(iconCode));
    dispatch(setDrawingMode('marker'));
    dispatch(setMode('marker' as any));
    setShowIconPicker(false);
  };

  return (
    <div className="w-full rounded-lg border border-zinc-600 bg-zinc-800/90 p-2 mb-3">
      <div className="text-xs font-semibold text-zinc-300 mb-2">Create new</div>
      {!showIconPicker ? (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              className="flex flex-col items-center gap-0.5 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors"
              onClick={() => handleCreateEntity('circle')}
              title="Circle">
              <FaCircleNotch size={18} />
              <span className="text-[10px]">Circle</span>
            </button>
            <button
              type="button"
              className="flex flex-col items-center gap-0.5 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors"
              onClick={() => handleCreateEntity('polygon')}
              title="Polygon">
              <PiPolygonFill size={18} />
              <span className="text-[10px]">Polygon</span>
            </button>
            <button
              type="button"
              className="flex flex-col items-center gap-0.5 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors"
              onClick={() => handleCreateEntity('ellipse')}
              title="Ellipse">
              <FaEllipsisH size={18} />
              <span className="text-[10px]">Ellipse</span>
            </button>
            <button
              type="button"
              className="flex flex-col items-center gap-0.5 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors"
              onClick={() => handleCreateEntity('sector')}
              title="Taboozone">
              <FaChartPie size={18} />
              <span className="text-[10px]">Taboozone</span>
            </button>
          </div>
          <button
            type="button"
            className="w-full mt-2 flex flex-col items-center gap-0.5 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors border-t border-zinc-600 pt-2"
            onClick={() => setShowIconPicker(true)}
            title="Point">
            <FaMapMarkerAlt size={18} />
            <span className="text-[10px]">Point</span>
            {selectedIcon && <span className="text-[9px] text-zinc-400">Icon selected</span>}
          </button>
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400">Choose icon</span>
            <button
              type="button"
              className="text-zinc-400 hover:text-white text-[10px]"
              onClick={() => setShowIconPicker(false)}>
              Back
            </button>
          </div>
          <div className="grid grid-cols-5 gap-1 max-h-[180px] overflow-y-auto">
            {MARKER_ICONS.map(({ code, label, font }) => (
              <button
                key={code}
                type="button"
                className="flex flex-col items-center gap-0.5 p-1 rounded hover:bg-zinc-600 border border-transparent hover:border-zinc-500 text-white transition-colors"
                onClick={() => handleCreateMarker(code)}
                title={label}>
                <span
                  className="text-lg w-6 h-6 flex items-center justify-center"
                  style={{ fontFamily: `${font}, sans-serif` }}>
                  {getMarkerIconChar(code)}
                </span>
                <span className="text-[9px] truncate max-w-full">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EntityCreationForm;
