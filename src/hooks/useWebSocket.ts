import { useEffect, useRef } from 'react';
import { WebSocketService } from '../services/webSocket/WebSocketService';
import type { OutboundMessageMap, OutboundMessageName } from "../services/webSocket/wsTypes";

export const useWebSocket = () => {
  const wsServiceRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    if (!wsServiceRef.current) {
      wsServiceRef.current = WebSocketService.getInstance();
    }
    return () => {
    };
  }, []); 

  const sendMessage = <T extends OutboundMessageName>(headerName: T, data: OutboundMessageMap[T]) => {
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