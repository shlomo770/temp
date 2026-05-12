
import { useEffect, useState } from "react";
import { WebSocketService } from "../services/webSocket/WebSocketService";

export const useWsConnection = () => {
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const ws = WebSocketService.getInstance();

        setConnected(ws.isConnected());

        const unsubscribe = ws.onConnectionChange((isConnected) => {
            setConnected(isConnected);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return connected;
};