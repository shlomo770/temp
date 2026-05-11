import { FC } from 'react';

interface CompassNeedleProps {
  bearing: number;
}

const CompassNeedle: FC<CompassNeedleProps> = ({ bearing }) => {
  return (
    <div
      className="fixed top-24 right-[300px] w-20 h-20 z-[9999] pointer-events-none"
      style={{
        transform: `rotate(${-bearing}deg)`,
        transition: 'transform 0.3s ease',
      }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="80"
        height="80"
        viewBox="0 0 64 64"
        className="drop-shadow-lg">
        <g transform="rotate(-30 32 32)">
          <path fill="#5dafd8" d="M29.5 27.9 26.9 29 13.5 64l23.6-29-.3-2.9z" opacity="1" data-original="#5dafd8" ></path>
          <path fill="red" d="m37.1 35-10.2-6L50.5 0z" opacity="1" data-original="red" ></path>
          <circle cx="32" cy="32" r="6" fill="#ffffff" opacity="1" data-original="#ffffff" ></circle>
          <path fill="#58717f" d="M35.5 34c-1.1 1.9-3.6 2.6-5.6 1.5-1.9-1.1-2.6-3.6-1.5-5.6 1.1-1.9 3.6-2.6 5.6-1.5 2 1.2 2.6 3.7 1.5 5.6z" opacity="1" data-original="#58717f" ></path>
        </g>
      </svg>
    </div>
  );
};

export default CompassNeedle; 