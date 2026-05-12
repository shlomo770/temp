import { Coordinates } from '../types';

export interface MyPositionData {
  coordinates: Coordinates;
  heading: number; // degrees
}

export interface MyPositionMessage {
  header: {
    name: 'POSITION';
  };
  data: MyPositionData;
} 