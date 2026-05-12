import {FC} from 'react';

const SettingsForm: FC = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">System Settings</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Display Brightness</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            defaultValue="70"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Sound Volume</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            defaultValue="50"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Map Zoom Level</label>
          <input 
            type="range" 
            min="1" 
            max="20" 
            defaultValue="12"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Auto Save</label>
          <div className="flex items-center">
            <input type="checkbox" className="mr-2" defaultChecked />
            <span className="text-sm text-gray-300">Enable auto save</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Notifications</label>
          <div className="flex items-center">
            <input type="checkbox" className="mr-2" defaultChecked />
            <span className="text-sm text-gray-300">Enable notifications</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Language</label>
          <select className="w-full px-3 py-2 bg-[#3a3a3a] text-white rounded-md border border-gray-600">
            <option>English</option>
            <option>Hebrew</option>
            <option>Arabic</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Time Zone</label>
          <select className="w-full px-3 py-2 bg-[#3a3a3a] text-white rounded-md border border-gray-600">
            <option>UTC+2 (Israel)</option>
            <option>UTC+0 (GMT)</option>
            <option>UTC-5 (EST)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SettingsForm; 