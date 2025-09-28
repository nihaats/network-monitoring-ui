import { Injectable, OnDestroy, signal } from "@angular/core";
import { Client, IMessage } from '@stomp/stompjs';
import { Subject } from "rxjs";
import { MessageType } from "../models/message-type.enum";
import { WebSocketMessage } from "../models/websocket-message.model";

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private stompClient!: Client;
  private messagesSubject$ = new Subject<WebSocketMessage>();
  private readonly WS_ENDPOINT = 'ws://localhost:8090/ws/snmp-data';
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
      connectHeaders: {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: (frame) => {
        console.log('🔗 STOMP Connected:', frame);
        this.isConnected = true;
        this.connectionStatus.set(true);

        // Clear any existing reconnect timer
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // Set up subscriptions
        this.setupSubscriptions();
      },

      onDisconnect: (frame) => {
        console.log('❌ STOMP Disconnected:', frame);
        this.isConnected = false;
        this.connectionStatus.set(false);
      },

      onStompError: (frame) => {
        console.error('❌ STOMP Error:', frame);
        this.isConnected = false;
        this.connectionStatus.set(false);
        this.attemptReconnect();
      },

      onWebSocketError: (error) => {
        console.error('❌ WebSocket Error:', error);
        this.isConnected = false;
        this.connectionStatus.set(false);
        this.attemptReconnect();
      },

      onWebSocketClose: (event) => {
        console.log('🔌 WebSocket Closed:', event);
        this.isConnected = false;
        this.connectionStatus.set(false);
        this.attemptReconnect();
      }
    });
  }

  private connect(): void {
    try {
      console.log('🔄 Attempting STOMP connection to:', this.WS_ENDPOINT);
      this.stompClient.activate();
    } catch (error) {
      console.error('❌ Connection error:', error);
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
    this.stompClient.subscribe('/topic/high-frequency-data', (message: IMessage) => {
      this.handleMessage(message, MessageType.HIGH_METRICS);
    });

    this.stompClient.subscribe('/topic/medium-frequency-data', (message: IMessage) => {
      this.handleMessage(message, MessageType.MEDIUM_METRICS);
    });

    this.stompClient.subscribe('/topic/low-frequency-data', (message: IMessage) => {
      this.handleMessage(message, MessageType.LOW_METRICS);
    });
  }

  private handleMessage(message: IMessage, defaultType: string): void {
    try {
      const parsedMessage = JSON.parse(message.body);

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

  ngOnDestroy(): void {
    this.messagesSubject$.complete();
  }
}
