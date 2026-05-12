import { Coordinates } from '../types';

export interface EntityUpdatedData {
  entityId: string;
  coordinates: Coordinates[];
}

export interface EntityUpdatedMessage {
  header: {
    name: 'ENTITY_UPDATED';
  };
  data: EntityUpdatedData;
} 