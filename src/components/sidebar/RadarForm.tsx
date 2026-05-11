import { useState, useEffect, useRef } from 'react';
import ToggleSwitch from '../ui/ToggleSwitch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useWebSocket } from '../../hooks/useWebSocket';
import { RadarStateE } from '../../enums/statusBar.enum';

const RadarForm = () => {
  const [isModeActive, setIsModeActive] = useState(false);
  const [missionType, setMissionType] = useState('0');
  const [frequency, setFrequency] = useState('0');
  const [isModeActive_mis, setIsModeActive_mis] = useState(false);
  const [missionType_mis, setMissionType_mis] = useState('0');
  const [frequency_mis, setFrequency_mis] = useState('0');
  const { sendMessage } = useWebSocket();
  const initRef = useRef(false);
  const radarState = useAppSelector(state => state.radar);
  
  type CommandName = 'state' | 'mode' | 'missionCategory' | 'frequency';
  const frequencies = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const misionType = ['1', '2', '3', '4', '5'];

  useEffect(() => {
    if (!initRef.current) {
      const isActive = radarState.serverValues?.mode === RadarStateE.OPERATE ? true : false;
      const MissionType = radarState.serverValues?.missionCategory.toString() ?? '0';
      const Frequency = radarState.serverValues?.freqIndex?.toString() ?? '0';
      setIsModeActive(isActive);
      setMissionType(MissionType);
      setFrequency(Frequency);
      initRef.current = true;
    }
    setIsModeActive_mis(radarState.serverValues?.mode !== RadarStateE.OPERATE ? false : true);
    setMissionType_mis(radarState.serverValues?.missionCategory?.toString() ?? '0');
    setFrequency_mis(radarState.serverValues?.freqIndex?.toString() ?? '0');
  }, [radarState.status, radarState.serverValues?.freqIndex, radarState.serverValues?.mode, radarState.serverValues?.missionCategory])

  const sendCommand = (name: CommandName, val: any) => {
    let messageData = {
      radar_mode: radarState.serverValues?.mode,
      mission_category: radarState.serverValues?.missionCategory,
      freq_index: radarState.serverValues?.freqIndex
    };

    switch (name) {
      case 'mode':
        setIsModeActive(val);
        messageData.radar_mode = val ? RadarStateE.OPERATE : RadarStateE.STANDBY;
        break;
      case 'missionCategory':
        setMissionType(val);
        messageData.mission_category = val;
        break;
      case 'frequency':
        setFrequency(val);
        messageData.freq_index = val;
        break;
      default:
        break;
    }
    sendMessage('SET_RADAR_PARAMS', messageData);
  }

  return (
    <div className="w-full p-6 font-sans min-h-[500px] flex flex-col">
      <div className="text-center border-b border-gray-600 pb-6 mb-8">
        <h3 className="text-xl font-semibold text-white">מכ"ם</h3>
      </div>
      <div className="mb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className={`mr-4 text-sm font-medium min-w-[60px] ${isModeActive ? 'text-sky-200' : 'text-gray-400'}`}>
              {isModeActive ? 'מבצעי' : RadarStateE[radarState.serverValues?.mode ?? 0]}
            </span>
            <ToggleSwitch
              checked={isModeActive}
              onChange={() => sendCommand('mode', !isModeActive)}
              activeColor="bg-sky-500"
              inactiveColor="bg-gray-600"
              size="md"
              ariaLabel="Toggle radar mode" />
            <span className={`ml-2 text-sm min-w-[60px] font-medium ${isModeActive_mis === isModeActive ? 'text-[transparent]' : 'text-red-600'}`}>
              {RadarStateE[radarState.serverValues?.mode ?? 0]}
            </span>
          </div>
          <span className="text-sm text-sky-100 font-medium">מוד</span>
        </div>
      </div>
      <div className="mb-10 flex-1">
        <div className="mb-8">
          <label className="block text-sm text-sky-100 mb-4 font-medium text-right">סוג משימה</label>
          <select
            value={missionType}
            onChange={(e) => sendCommand('missionCategory', e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-600 rounded text-sm focus:outline-none focus:border-sky-500 transition-colors">
            {misionType.map((freq) => (
              <option key={freq} value={freq}>{freq}</option>
            ))}
          </select>
          <span className={`ml-2 text-sm min-w-[60px] font-medium ${missionType_mis === missionType ? 'text-[transparent]' : 'text-red-600'}`}>
            {missionType_mis}
          </span>
        </div>
        <div>
          <label className="block text-sm text-sky-100 mb-4 font-medium text-right">תדר</label>
          <select
            value={frequency}
            onChange={(e) => sendCommand('frequency', e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-600 rounded text-sm focus:outline-none focus:border-sky-500 transition-colors">
            {frequencies.map((freq) => (
              <option key={freq} value={freq}>{freq}</option>
            ))}
          </select>
          <span className={`ml-2 text-sm min-w-[60px] font-medium ${frequency_mis === frequency ? 'text-[transparent]' : 'text-red-600'}`}>
            {frequency_mis}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RadarForm; 