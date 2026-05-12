
import { store } from '../../store/store';
import { messageHandlers } from '../messageHandlers/MessageHandlers';
import type { WSMessage, OutboundMessageMap, OutboundMessageName } from './wsTypes';
import { unwrapVal } from '../../utils/unwrapVal';
import { servers } from '../../config/communication.json'
import { WsMessageName } from '../../enums/ws.enum';
import { validateOutboundMessage } from './wsValidators';


let instance: WebSocketService | null = null;

export class WebSocketService {
  public ws: WebSocket | null = null;
  private url!: string;
  private isConnecting = false;
  private isDestroyed = false;
  private shouldReconnect = true;
  private connectionListeners = new Set<(connected: boolean) => void>();
  private reconnectTimer: any;
  private attempt = 0;
  private readonly reconnectBase = 1000;   // 1s
  private readonly reconnectMax = 15000;  // 15s
  private pingInterval: any;
  private readonly pingEveryMs = 30000;
  private messageQueue: Array<{ headerName: OutboundMessageName; data: any }> = [];
  private readonly MAX_QUEUE = 500;

  static getInstance(url: string = `ws://${servers.messagesServer}`) {
    if (!instance) instance = new WebSocketService(url);
    return instance;
  }

  constructor(url: string) {
    this.url = url;
    this.connect();
  }

  public onConnectionChange(cb: (connected: boolean) => void) {
    this.connectionListeners.add(cb);
    return () => this.connectionListeners.delete(cb);
  }

  private emitConnection(connected: boolean) {
    this.connectionListeners.forEach(cb => cb(connected));
  }


  private connect() {
    if (this.isConnecting || this.isDestroyed) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;

    this.isConnecting = true;
    try {
      this.ws = new WebSocket(this.url);
      const connectionTimeout = setTimeout(() => {
        if (this.ws?.readyState === WebSocket.CONNECTING) {
          this.ws.close();
          this.isConnecting = false;
          this.scheduleReconnect();
        }
      }, 5000);

      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        this.isConnecting = false;
        this.attempt = 0;
        if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
        this.flushMessageQueue();
        this.sendPing();
        this.startPingInterval();
        this.emitConnection(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          this.handleMessage(raw);
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      this.ws.onclose = () => {
        clearTimeout(connectionTimeout);
        this.isConnecting = false;
        if (!this.isDestroyed && this.shouldReconnect) this.scheduleReconnect();
        this.emitConnection(false);
      };

      this.ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        this.isConnecting = false;
        console.error('WS error:', error);
        this.emitConnection(false);
      };
    } catch (e) {
      this.isConnecting = false;
      console.error('WS create error:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.isDestroyed || !this.shouldReconnect) return;
    const delay = Math.min(this.reconnectMax, this.reconnectBase * Math.pow(2, this.attempt));
    const jitter = Math.random() * 300;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.attempt++;
      if (!this.isDestroyed) this.connect();
    }, delay + jitter);
  }

  private handleMessage(raw: any) {
    if (!raw || typeof raw !== 'object') return;
    const { header, data } = raw;
    if (!header || typeof header !== 'object' || !header.name) return;

    const normalized = unwrapVal(data);

    const name = header.name as WsMessageName;
    if (!Object.values(WsMessageName).includes(name)) {
      // console.warn('WS IN unknown message type:', header.name);
      return;
    }
    const handler = messageHandlers[name];

    // dlog('WS IN:', header.name, normalized);

    if (!handler) {
      console.warn('No handler for message type:', header.name);
      return;
    }
    try {
      const msg = { header, data: normalized } as WSMessage;
      const result = handler(msg.data as any, store);
      if (result && typeof (result as Promise<void>).then === "function") {
        (result as Promise<void>).catch((e) => {
          console.error('Async handler error for', header.name, e);
        });
      }
    } catch (e) {
      console.error('Handler error for', header.name, e);
    }
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const m = this.messageQueue.shift()!;
      this.sendMessageInternal(m.headerName, m.data);
    }
  }

  private sendMessageInternal<T extends OutboundMessageName>(headerName: T, data: OutboundMessageMap[T]) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        header: { name: headerName },
        // data: wrapVal(data)
        data: data
      };
      // dlog('WS OUT:', headerName, data);
      this.ws.send(JSON.stringify(message));
    }
  }

  public sendMessage<T extends OutboundMessageName>(headerName: T, data: OutboundMessageMap[T]) {
    if (!validateOutboundMessage(headerName, data)) {
      console.error("WS OUT invalid payload:", headerName, data);
      return;
    }
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendMessageInternal(headerName, data);
    } else {
      if (this.messageQueue.length >= this.MAX_QUEUE) this.messageQueue.shift();
      this.messageQueue.push({ headerName, data });
    }
  }

  private sendPing() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ header: { name: WsMessageName.Ping }, data: { timestamp: Date.now() } }));
    }
  }

  private startPingInterval() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendPing();
      } else if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }
    }, this.pingEveryMs);
  }

  public disconnect() {
    this.isDestroyed = true;
    this.shouldReconnect = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    this.connectionListeners.clear();
    this.messageQueue = [];

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnecting = false;
    this.emitConnection(false);

    instance = null;
  }

  public isConnected() { return this.ws?.readyState === WebSocket.OPEN; }
  public getReadyState() { return this.ws?.readyState ?? WebSocket.CLOSED; }
}



