import { FC } from 'react';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { setMapType } from '../../store/slices/mapSlice';
import { mapTypesSelected } from '../../types';

interface BaseMapSelectorProps {
  isOpen: boolean;
  onToggle: () => void;
}

const BaseMapSelector: FC<BaseMapSelectorProps> = ({ isOpen, onToggle }) => {
  const dispatch = useAppDispatch();
  const selectedMapType = useAppSelector(state => state.map.selectedMapType);
  const handleMapTypeSelect = (mapType: typeof mapTypesSelected[0]) => {
    dispatch(setMapType(mapType.id));
    onToggle();
  };

  return (
    <div className="relative">
      {isOpen && (
        <div
          className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-lg p-1 z-50 min-w-[140px]"
          onPointerDown={(e) => e.stopPropagation()}>
          <div className="space-y-0.5">
            {mapTypesSelected.map((mapType) => (
              <button
                key={mapType.id}
                onPointerDown={() => handleMapTypeSelect(mapType)}
                className={`w-full flex items-center p-1.5 rounded text-xs transition-all duration-200 ${selectedMapType === mapType.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}>
                <span className="text-sm mr-1.5">{mapType.icon}</span>
                <span className="flex-1 text-left">{mapType.name}</span>
                {selectedMapType === mapType.id && (
                  <svg className="w-3 h-3 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BaseMapSelector; 