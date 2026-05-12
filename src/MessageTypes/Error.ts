export interface ErrorData {
  code: string;
  message: string;
  details?: any;
}

export interface ErrorMessage {
  header: {
    name: 'ERROR';
  };
  data: ErrorData;
} 