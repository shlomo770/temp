export interface TargetUpdateData {
  id: string;
  coordinates: { lat: number; lng: number };
  heading: number;
  speed: number;
  type: string;
  timestamp: number;
}

export interface TargetUpdateMessage {
  header: {
    name: 'TARGET_UPDATE';
  };
  data: TargetUpdateData;
} 