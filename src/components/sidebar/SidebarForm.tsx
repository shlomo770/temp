import { FC } from 'react';
import { IoClose } from 'react-icons/io5';
import RadarForm from './RadarForm';
import FaultsList from './FailuresForm';
import LocationForm from './LocationForm';
import ServerMessagesPanel from './MessageCard';

interface SidebarFormProps {
  type: any;
  onClose: () => void;
}

const SidebarForm: FC<SidebarFormProps> = ({ type, onClose }) => {
  const getFormComponent = () => {
    switch (type) {
      case 'radar':
        return <RadarForm />;
      case 'failures':
        return <FaultsList />;
      case 'location':
        return <LocationForm />;
      case 'serverMessages':
        return <ServerMessagesPanel />;
      default:
        return <div className="text-white">Unknown panel type</div>;
    }
  };

  return (
    <div className="fixed left-16 top-[60px] h-full w-[350px] bg-[#1f2937] shadow-lg z-40 p-6">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 z-50"
      >
        <IoClose size={24} />
      </button>
      <div className="h-full overflow-y-auto">
        {getFormComponent()}
      </div>
    </div>
  );
};

export default SidebarForm; 