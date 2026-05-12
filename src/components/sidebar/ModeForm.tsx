import {FC} from 'react';


const ModeForm: FC = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">System Mode</h3>
      <div className="space-y-3">
        <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
          Mission Mode
        </button>
        <button className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
          Planning Mode
        </button>
        <button className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors">
          Training Mode
        </button>
        <button className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors">
          Maintenance Mode
        </button>
        <button className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors">
          Emergency Mode
        </button>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-600">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Current Status</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Active Mode:</span>
            <span className="text-green-400">Mission</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">System Status:</span>
            <span className="text-green-400">Operational</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Last Update:</span>
            <span className="text-gray-300">2 min ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeForm; 