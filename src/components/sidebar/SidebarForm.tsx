import { memo, type ReactNode } from 'react';
import { IoClose } from 'react-icons/io5';
import RadarForm from './RadarForm';
import FaultsList from './FailuresForm';
import LocationForm from './LocationForm';
import XmlSendForm from './XmlSendForm';
import ServerMessagesPanel from './ServerMessagesPanel';
import TerrainPanel from '../map/terrain/TerrainPanel';

interface SidebarFormProps {
  type: any;
  onClose: () => void;
  mapServiceRef?: React.MutableRefObject<any>;
  clickedCoords?: { lat: number; lng: number } | null;
}

function sameClicked(
  a: SidebarFormProps['clickedCoords'],
  b: SidebarFormProps['clickedCoords']
): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return a.lat === b.lat && a.lng === b.lng;
}

function sidebarFormEqual(prev: SidebarFormProps, next: SidebarFormProps): boolean {
  return (
    prev.type === next.type &&
    prev.onClose === next.onClose &&
    prev.mapServiceRef === next.mapServiceRef &&
    sameClicked(prev.clickedCoords, next.clickedCoords)
  );
}

function SidebarFormInner({ type, onClose, clickedCoords, mapServiceRef }: SidebarFormProps) {
  let body: ReactNode;
  switch (type) {
    case 'radar':
      body = <RadarForm />;
      break;
    case 'failures':
      body = <FaultsList />;
      break;
    case 'location':
      body = <LocationForm clickedCoords={clickedCoords} />;
      break;
    case 'xmlSend':
      body = <XmlSendForm />;
      break;
    case 'serverMessages':
      body = <ServerMessagesPanel />;
      break;
    case 'terrain':
      body = <TerrainPanel map={mapServiceRef?.current?.getMap?.() ?? null} />;
      break;
    default:
      body = <div className="text-white">Unknown panel type</div>;
  }

  const panelWidth =
    type === 'xmlSend' || type === 'serverMessages'
      ? 'w-[min(100vw-4rem,480px)]'
      : 'w-[350px]';

  return (
    <div
      className={`fixed left-16 top-[60px] h-full ${panelWidth} bg-[#1f2937] shadow-lg z-40 p-4 sm:p-5`}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 z-50"
      >
        <IoClose size={24} />
      </button>
      <div className="h-full overflow-y-auto">{body}</div>
    </div>
  );
}

const SidebarForm = memo(SidebarFormInner, sidebarFormEqual);
export default SidebarForm; 