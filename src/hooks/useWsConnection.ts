import { useEffect, useState } from "react";
import { WebSocketService } from "../services/webSocket/WebSocketService";


export const useWsConnection = () => {
    const [connected, setConnected] = useState(
        WebSocketService.getInstance().isConnected()
    );


    useEffect(() => {
        const ws = WebSocketService.getInstance();
        const unsubscribe = ws.onConnectionChange(setConnected);
        return () => {
            unsubscribe();
        }
    }, []);


    return connected;
};
