import {FC} from 'react';

const GunForm: FC = () => {
  return (
    <div className="w-full p-6 font-sans min-h-[500px] flex flex-col">
      <div className="text-center border-b border-gray-600 pb-6 mb-8">
        <h3 className="text-xl font-semibold text-white">GUN</h3>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-lg">Gun Control Panel</p>
      </div>
    </div>
  );
};

export default GunForm; 