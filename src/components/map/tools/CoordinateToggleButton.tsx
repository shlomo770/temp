import React ,{FC} from 'react';
import { useAppSelector } from '../../../hooks/useAppSelector';
import { useAppDispatch } from '../../../hooks/useAppDispatch';
import { toggleCoordinateSystem } from '../../../store/slices/coordinatesSlice';

const CoordinateToggleButton: FC = () => {
  const dispatch = useAppDispatch();
  const isUTM = useAppSelector(state => state.coordinates.isUTM);

  const handleCoordinateSystemToggle = () => {
    dispatch(toggleCoordinateSystem());
  };

  return (
    <div className="absolute bottom-4 left-4 z-30">
      <button
        onClick={handleCoordinateSystemToggle}
        className={`
          w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200
          hover:scale-110 active:scale-95 shadow-lg border-2
          ${isUTM 
            ? 'bg-blue-500 text-white border-blue-400 hover:bg-blue-600' 
            : 'bg-gray-600 text-gray-300 border-gray-500 hover:bg-gray-500 hover:text-white'
          }
        `}
        title={`Switch to ${isUTM ? 'WGS84' : 'UTM'} coordinates`}
      >
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold">
            {isUTM ? 'U' : 'W'}
          </span>
          <span className="text-xs font-medium">
            {isUTM ? 'UTM' : 'WGS84'}
          </span>
        </div>
      </button>
    </div>
  );
};

export default CoordinateToggleButton; 