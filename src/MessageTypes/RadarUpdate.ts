export interface RadarUpdateData {
  frequency: number;
  power: number;
  range: number;
  mode: string;
  status: 'red' | 'orange' | 'yellow' | 'green';
}

export interface RadarUpdateMessage {
  header: {
    name: 'RADAR_UPDATE';
  };
  data: RadarUpdateData;
} 