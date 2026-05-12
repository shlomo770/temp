import { Coordinates } from '../types';

export interface EntityPositionData {
  entityId: string;
  coordinates: Coordinates[];
}

export interface EntityPositionMessage {
  header: {
    name: 'ENTITY_POSITION';
  };
  data: EntityPositionData;
} 