import { useEffect, useRef } from 'react';
import { WebSocketService } from '../services/webSocket/WebSocketService';

export const useWebSocket = () => {
  const wsServiceRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    if (!wsServiceRef.current) {
      wsServiceRef.current = WebSocketService.getInstance();
    }
    return () => {
    };
  }, []); 

  const sendMessage = (headerName: string, data: any) => {
    if (wsServiceRef.current) {
      wsServiceRef.current.sendMessage(headerName, data);
    }
  };

  const isConnected = () => {
    return wsServiceRef.current?.isConnected() || false;
  };

  return {
    sendMessage,
    isConnected
  };
}; 