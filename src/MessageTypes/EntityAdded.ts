import { Entity } from '../types';

export interface EntityAddedData {
  entity: Entity;
}

export interface EntityAddedMessage {
  header: {
    name: 'ENTITY_ADDED';
  };
  data: EntityAddedData;
} 