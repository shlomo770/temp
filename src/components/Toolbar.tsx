import React, { useState, useRef } from 'react';
import { useAppSelector } from '../hooks/useAppSelector';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setDrawingMode, clearEntities } from '../store/slices/entitiesSlice';
import { setRotation, setBrightness, resetMap } from '../store/mapSlice';
import { EntityType } from '../types';

interface ToolbarProps {
  isMeasuring: boolean;
  onMeasureClick: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ isMeasuring, onMeasureClick }) => {
  const dispatch = useAppDispatch();
  const { drawingMode } = useAppSelector(state => state.entities);
  const { rotation, brightness } = useAppSelector(state => state.map);

  const [showRotation, setShowRotation] = useState(false);
  const [showBrightness, setShowBrightness] = useState(false);

  const handleDrawingModeChange = (mode: EntityType | null) => {
    dispatch(setDrawingMode(mode));
  };

  const handleRotationChange = (value: number) => {
    dispatch(setRotation(value));
  };

  const handleBrightnessChange = (value: number) => {
    dispatch(setBrightness(value));
  };

  const handleClearAll = () => {
    dispatch(clearEntities());
  };

  const handleResetMap = () => {
    dispatch(resetMap());
  };

  const drawingTools: { type: EntityType; label: string; icon: string }[] = [
    { type: 'polygon', label: 'Polygon', icon: '⬟' },
    { type: 'line', label: 'Line', icon: '╱' },
    { type: 'rectangle', label: 'Rectangle', icon: '▭' },
    { type: 'circle', label: 'Circle', icon: '●' },
    { type: 'marker', label: 'Marker', icon: '📍' }
  ];

  // Close popups on outside click
  const toolbarRef = useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!toolbarRef.current) return;
      if (!toolbarRef.current.contains(e.target as Node)) {
        setShowRotation(false);
        setShowBrightness(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div
      ref={toolbarRef}
      className="flex flex-col gap-1 p-1"
    >
      {/* Drawing Tools */}
      {drawingTools.map((tool) => (
        <button
          key={tool.type}
          onClick={() => handleDrawingModeChange(drawingMode === tool.type ? null : tool.type)}
          className={`w-9 h-9 flex items-center justify-center rounded-full text-lg transition-all border border-transparent hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            drawingMode === tool.type ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-800'
          }`}
          title={tool.label}
        >
          {tool.icon}
        </button>
      ))}
      {/* Measure Distance Button */}
      <button
        onClick={onMeasureClick}
        className={`w-9 h-9 flex items-center justify-center rounded-full text-lg transition-all border border-transparent hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${
          isMeasuring ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-800'
        }`}
        title="Measure Distance"
      >
        <span>📏</span>
      </button>
      {/* Rotation Button */}
      <div className="relative">
        <button
          onClick={() => setShowRotation((v) => !v)}
          className={`w-9 h-9 flex items-center justify-center rounded-full text-lg transition-all border border-transparent hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            showRotation ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-800'
          }`}
          title="Map Rotation"
        >
          <span role="img" aria-label="Rotate">⟳</span>
        </button>
        {showRotation && (
          <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-white/70 border border-gray-200 shadow rounded-lg px-2 py-1 flex items-center z-50 min-w-[80px]">
            <input
              type="range"
              min="0"
              max="360"
              value={rotation}
              onChange={(e) => handleRotationChange(Number(e.target.value))}
              className="w-20 h-2 bg-gray-200 rounded appearance-none cursor-pointer"
              style={{ minWidth: 60 }}
            />
          </div>
        )}
      </div>
      {/* Brightness Button */}
      <div className="relative">
        <button
          onClick={() => setShowBrightness((v) => !v)}
          className={`w-9 h-9 flex items-center justify-center rounded-full text-lg transition-all border border-transparent hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            showBrightness ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-800'
          }`}
          title="Map Brightness"
        >
          <span role="img" aria-label="Brightness">☀️</span>
        </button>
        {showBrightness && (
          <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-white/70 border border-gray-200 shadow rounded-lg px-2 py-1 flex items-center z-50 min-w-[80px]">
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={brightness}
              onChange={(e) => handleBrightnessChange(Number(e.target.value))}
              className="w-20 h-2 bg-gray-200 rounded appearance-none cursor-pointer"
              style={{ minWidth: 60 }}
            />
          </div>
        )}
      </div>
      {/* Reset Map Button */}
      <button
        onClick={handleResetMap}
        className="w-9 h-9 flex items-center justify-center rounded-full text-lg transition-all border border-transparent hover:bg-yellow-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white text-yellow-600"
        title="Reset Map"
      >
        <span role="img" aria-label="Reset">🔄</span>
      </button>
      {/* Clear All Button */}
      <button
        onClick={handleClearAll}
        className="w-9 h-9 flex items-center justify-center rounded-full text-lg transition-all border border-transparent hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400 bg-white text-red-600"
        title="Clear All Entities"
      >
        <span role="img" aria-label="Clear">🗑️</span>
      </button>
    </div>
  );
};

export default Toolbar; 