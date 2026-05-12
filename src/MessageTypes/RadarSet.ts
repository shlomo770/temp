export interface RadarSetData {
  frequency: number;
  power: number;
  range: number;
  mode: string;
}

export interface RadarSetMessage {
  header: {
    name: 'RADAR_SET';
  };
  data: RadarSetData;
} 