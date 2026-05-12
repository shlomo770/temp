export interface SaveResultData {
  success: boolean;
  message: string;
  entityId?: string;
}

export interface SaveResultMessage {
  header: {
    name: 'SAVE_RESULT';
  };
  data: SaveResultData;
} 