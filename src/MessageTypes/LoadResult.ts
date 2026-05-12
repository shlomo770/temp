import { Entity } from '../types';

export interface LoadResultData {
  entities: Entity[];
  success: boolean;
  message?: string;
}

export interface LoadResultMessage {
  header: {
    name: 'LOAD_RESULT';
  };
  data: LoadResultData;
} 