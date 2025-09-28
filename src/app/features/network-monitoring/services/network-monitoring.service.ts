import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { WebSocketService } from './websocket.service';

// API Response interfaces
export interface SnmpDataItem {
  id: string;
  oid: string;
  value: string;
  deviceIp: string;
  timestamp: string;
  metricType: string;
  readableValue: string;
  createdAt: string;
  frequencyType: string;
}

export interface ApiResponse {
  data: SnmpDataItem[];
  count: number;
  status: string;
}

// Dashboard interfaces
export interface NetworkMetrics {
  packets: { ipIn: number; ipOut: number; icmpIn: number; icmpOut: number };
  connections: { tcp: number; udp: number; tcpActive: number };
  deviceInfo: { arpEntries: number; ttl: number };
  deviceStatus: { online: number; warning: number; offline: number };
  lastUpdate: string;
  source: 'websocket' | 'http';
}

export interface DeviceMetrics {
  deviceIp: string;
  tcpConnections: number;
  udpDatagrams: number;
  ipPackets: { in: number; out: number };
  icmpMessages: { in: number; out: number };
  arpEntries: number;
  lastUpdate: string;
}

@Injectable({
  providedIn: 'root'
})
export class NetworkMonitoringService {
  private http = inject(HttpClient);
  private wsService = inject(WebSocketService);
  private readonly apiUrl = 'http://localhost:8090/api/v1';

  // Connection tracking
  private lastWebSocketMessage = 0;
  private readonly WS_TIMEOUT = 10000; // 10 seconds timeout

  constructor() {
    // WebSocket mesajlarını dinle ve timeout kontrolü yap
    this.wsService.messages$.subscribe({
      next: (message) => {
        console.log('📞 WebSocket message received:', message.type);
        this.lastWebSocketMessage = Date.now();
      },
      error: (error) => {
        console.error('❌ WebSocket message error:', error);
        this.lastWebSocketMessage = 0;
      }
    });
  }

  /**
   * Get latest SNMP data from API (HTTP fallback only)
   */
  getAllMetrics(): Observable<SnmpDataItem[]> {
    return this.http.get<SnmpDataItem[]>(`${this.apiUrl}/all-metrics`);
  }

  getNetworkMetrics(): Observable<NetworkMetrics> {
    const websocketMetrics$ = this.wsService.messages$.pipe(
      map(message => {
        const metrics = this.transformHttpToNetworkMetrics(message.data);
        return metrics;
      }),
      catchError(error => {
        console.error('❌ WebSocket stream error:', error);
        return EMPTY;
      })
    );

    return websocketMetrics$;
  }

  /**
   * Get current network metrics (single HTTP call for initial load)
   */
  getCurrentMetrics(): Observable<NetworkMetrics> {
    return this.getAllMetrics().pipe(
      map(response => this.transformHttpToNetworkMetrics(response)),
      catchError(error => {
        console.error('❌ Error fetching current metrics:', error);
        return of(this.getDefaultMetrics());
      })
    );
  }

  /**
   * Transform HTTP API data to NetworkMetrics
   */
  private transformHttpToNetworkMetrics(data: SnmpDataItem[]): NetworkMetrics {
    const ipIn = this.getMetricValue(data, 'ip_in_receives');
    const ipOut = this.getMetricValue(data, 'ip_out_requests');
    const tcpEstab = this.getMetricValue(data, 'tcp_curr_estab');
    const tcpActive = this.getMetricValue(data, 'tcp_active_opens');
    const udpIn = this.getMetricValue(data, 'udp_in_datagrams');
    const icmpIn = this.getMetricValue(data, 'icmp_in_msgs');
    const icmpOut = this.getMetricValue(data, 'icmp_out_msgs');
    const arpEntries = this.getMetricValue(data, 'arp_table_entry');
    const ttl = this.getMetricValue(data, 'ip_default_ttl');

    return {
      packets: {
        ipIn: ipIn,
        ipOut: ipOut,
        icmpIn: icmpIn,
        icmpOut: icmpOut
      },
      connections: {
        tcp: tcpEstab,
        udp: udpIn,
        tcpActive: tcpActive
      },
      deviceInfo: {
        arpEntries: arpEntries,
        ttl: ttl
      },
      deviceStatus: {
        online: tcpEstab > 0 ? 1 : 0,
        warning: arpEntries === 0 ? 1 : 0,
        offline: 0
      },
      lastUpdate: data[0]?.timestamp || new Date().toISOString(),
      source: 'http'
    };
  }

  /**
   * Get metric value by type
   */
  private getMetricValue(data: SnmpDataItem[], metricType: string): number {
    const metric = data.find(item => item.metricType === metricType);
    return metric ? parseInt(metric.value) || 0 : 0;
  }

  /**
   * Get default metrics for error cases or initial state
   */
  private getDefaultMetrics(): NetworkMetrics {
    return {
      packets: { ipIn: 0, ipOut: 0, icmpIn: 0, icmpOut: 0 },
      connections: { tcp: 0, udp: 0, tcpActive: 0 },
      deviceInfo: { arpEntries: 0, ttl: 64 },
      deviceStatus: { online: 0, warning: 0, offline: 0 },
      lastUpdate: new Date().toISOString(),
      source: 'http'
    };
  }
}
