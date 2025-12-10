import { inject, Injectable, OnDestroy, signal } from "@angular/core";
import { Client, IMessage } from '@stomp/stompjs';
import { Subject } from "rxjs";
import { websocketEnv } from "../../../../environments/environment";
import { AuthService } from "../../user-management/services/auth.service";
import { MessageType } from "../models/message-type.enum";
import { WebSocketMessage } from "../models/websocket-message.model";

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly WS_ENDPOINT = websocketEnv.wsUrl + '/snmp-data';
  private readonly messagesSubject$ = new Subject<WebSocketMessage>();
  private stompClient!: Client;
  private isConnected = false;
  private reconnectTimer: any;

  public messages$ = this.messagesSubject$.asObservable();
  connectionStatus = signal<boolean>(false);

  constructor() {
    this.initializeStompClient();
    this.connect();
  }

  private initializeStompClient(): void {
    this.stompClient = new Client({
      brokerURL: this.WS_ENDPOINT,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        this.isConnected = true;
        this.connectionStatus.set(true);

        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        this.setupSubscriptions();
      },

      onDisconnect: (frame) => {
        console.log('STOMP Disconnected:', frame);
        this.isConnected = false;
        this.connectionStatus.set(false);
      },

      onStompError: (frame) => {
        console.error('STOMP Error:', frame);
        this.isConnected = false;
        this.connectionStatus.set(false);
        this.attemptReconnect();
      },

      onWebSocketError: (error) => {
        console.error('WebSocket Error:', error);
        this.isConnected = false;
        this.connectionStatus.set(false);
        this.attemptReconnect();
      },

      onWebSocketClose: (event) => {
        console.log('WebSocket Closed:', event);
        this.isConnected = false;
        this.connectionStatus.set(false);
        this.attemptReconnect();
      }
    });
  }

  private connect(): void {
    try {
      this.stompClient.activate();
    } catch (error) {
      console.error('Connection error:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectTimer) {
      return; // Already attempting to reconnect
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  private setupSubscriptions(): void {
    const userId = localStorage.getItem('userId') || '';

    this.stompClient.subscribe(`/topic/high-frequency-data/${userId}`, (message: IMessage) => {
      this.handleMessage(message, MessageType.HIGH_METRICS);
    });

    this.stompClient.subscribe(`/topic/medium-frequency-data/${userId}`, (message: IMessage) => {
      this.handleMessage(message, MessageType.MEDIUM_METRICS);
    });

    this.stompClient.subscribe(`/topic/low-frequency-data/${userId}`, (message: IMessage) => {
      this.handleMessage(message, MessageType.LOW_METRICS);
    });
  }

  private handleMessage(message: IMessage, defaultType: string): void {
    if (this.authService.authenticated()) {
      try {
        const parsedMessage = JSON.parse(message.body);
        console.log('parsedMessage: ', parsedMessage);

        // Create WebSocketMessage format
        const webSocketMessage: WebSocketMessage = {
          type: parsedMessage.type || defaultType as any,
          data: parsedMessage.data || parsedMessage,
          timestamp: parsedMessage.timestamp || Date.now()
        };

        console.log('📨 STOMP message received:', webSocketMessage);
        this.connectionStatus.set(true);
        this.messagesSubject$.next(webSocketMessage);
      } catch (error) {
        console.error('❌ Error parsing message:', error, message.body);
      }
    }
  }

  ngOnDestroy(): void {
    this.messagesSubject$.complete();
  }
}
