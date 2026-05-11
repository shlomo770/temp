import React, { useEffect, useState } from 'react';

export interface StatusBarProps {
  mouseCoords: { lat: number; lng: number } | null;
}

const statusColors: Record<string, string> = {
  connected: 'text-green-400',
  disconnected: 'text-red-400',
  standby: 'text-yellow-400',
  oper: 'text-blue-400',
  armed: 'text-orange-400',
  idle: 'text-gray-400',
  default: 'text-gray-300',
};

const iconMap: Record<string, JSX.Element> = {
  cursor: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>,
  com: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>,
  tmaps: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>,
  radar: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>,
  iff: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>,
  crf: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>,
  gun: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>,
  drone: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>,
  'jbk coordinate': <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>,
  time: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
  default: <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>,
};

const minWidth = 80;

const StatusBar: React.FC<StatusBarProps> = ({ mouseCoords }) => {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      setTime(`${h}:${m}`);
      const d = now.getDate().toString().padStart(2, '0');
      const month = now.toLocaleString('default', { month: 'short' }).toUpperCase();
      setDate(`${d} ${month}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const radarStatus = 'standby';

  const items = [
    { key: 'CURSOR COORDINATE', status: mouseCoords ? `${mouseCoords.lat.toFixed(2)}, ${mouseCoords.lng.toFixed(2)}` : 'idle', icon: 'cursor', opensForm: false },
    { key: 'COM', status: 'connected', icon: 'com', opensForm: true },
    { key: 'TMAPS', status: 'oper', icon: 'tmaps', opensForm: false },
    { key: 'RADAR', status: radarStatus, icon: 'radar', opensForm: true },
    { key: 'IFF', status: 'disconnected', icon: 'iff', opensForm: true },
    { key: 'CRF', status: 'connected', icon: 'crf', opensForm: false },
    { key: 'GUN', status: 'armed', icon: 'gun', opensForm: false },
    { key: 'DRONE', status: 'armed', icon: 'drone', opensForm: true },
    { key: 'JBK COORDINATE', status: '', icon: 'jbk coordinate', opensForm: false },
    { key: 'TIME', status: date, icon: 'time', opensForm: false },
  ];

  // Always use compact font
  const fontSize = '11px';

  return (
    <div className="fixed bottom-1 left-4 right-4 z-50" style={{ zIndex: 1001 }}>
      <div className="bg-zinc-700 backdrop-blur-md rounded-xl h-10 shadow-md border border-zinc-700 flex flex-nowrap items-center justify-center" style={{fontSize, lineHeight:'1.1', paddingTop:2, paddingBottom:2}}>
        {items.map((item, index) => {
          const textColor = statusColors[item.status] || statusColors.default;
          const Icon = iconMap[item.icon?.toLowerCase()] || iconMap['default'];
          return (
            <button
              key={item.key}
              className={`flex flex-none items-center justify-center gap-1 text-white px-2 min-w-[${minWidth}px] transition bg-transparent border-0 focus:outline-none ${index !== 0 ? 'border-l border-zinc-600' : ''}`}
              tabIndex={-1}
              style={{ cursor: item.opensForm ? 'pointer' : 'default', paddingTop:2, paddingBottom:2 }}
              disabled
            >
              {Icon}
              <div className="flex flex-col items-start">
                <span className="text-xs font-semibold leading-none">{item.key === 'TIME' ? time : item.key}</span>
                <span className={`text-xs font-semibold leading-none ${textColor}`}>{item.status}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StatusBar; 