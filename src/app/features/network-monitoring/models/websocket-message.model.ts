export interface WebSocketMessage {
  type: 'LATEST_METRICS' | 'DEVICE_METRICS' | 'BANDWIDTH_DATA' | 'SNMP_UPDATE' | 'PONG' | 'TEST_PING';
  data: any;
  timestamp: number;
}

// Network metrics data yapısı
export interface NetworkMetricsData {
  packets: {
    ipIn: number;
    ipOut: number;
    icmpIn: number;
    icmpOut: number;
  };
  connections: {
    tcp: number;
    udp: number;
    tcpActive: number;
  };
  deviceInfo: {
    arpEntries: number;
    ttl: number;
  };
  deviceStatus: {
    online: number;
    warning: number;
    offline: number;
  };
  lastUpdate: string;
  source: string;
}

// Bandwidth data yapısı
export interface BandwidthData {
  history: Array<{
    time: string;
    ipIn: number;
    ipOut: number;
  }>;
  packets: {
    ipIn: number;
    ipOut: number;
  };
}

// Device metrics data yapısı
export interface DeviceMetricsData {
  deviceIp: string;
  timestamp: string;
  metrics: any[];
}
