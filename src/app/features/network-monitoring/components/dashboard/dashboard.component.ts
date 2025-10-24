import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit, inject } from '@angular/core';
import ApexCharts from 'apexcharts';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../user-management/services/auth.service';
import { NetworkMetrics, NetworkMonitoringService } from '../../services/network-monitoring.service';
import { WebSocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly unsubscribe = new Subject<void>();
  private readonly networkService = inject(NetworkMonitoringService);
  private readonly wsService = inject(WebSocketService);
  private readonly authService = inject(AuthService);

  // ApexCharts instances
  private packetChart!: ApexCharts;
  private connectionChart!: ApexCharts;
  private protocolChart!: ApexCharts;
  private statusChart!: ApexCharts;

  // Data properties
  currentMetrics: NetworkMetrics | null = null;
  connectionStatus: 'websocket' | 'http' | 'disconnected' = 'disconnected';
  ipAddress: string = '';

  ngOnInit(): void {
    this.initializeWebSocketAndLoadData();
    this.authService.getIPAddress().pipe(takeUntil(this.unsubscribe)).subscribe({
      next: (res) => {
        this.ipAddress = res.ipAddress;
      },
      error: (error) => {
        console.error('Error fetching IP address:', error);
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  private initializeWebSocketAndLoadData(): void {
    // Get initial HTTP data first
    this.networkService.getCurrentMetrics().pipe(takeUntil(this.unsubscribe)).subscribe({
      next: (initialMetrics) => {
        this.currentMetrics = initialMetrics;
        this.connectionStatus = initialMetrics.source;
        this.updateChartsWithRealData(initialMetrics);
      },
      error: (error) => {
        console.error('❌ Error loading initial data:', error);
      }
    });

    // Then start listening for WebSocket events
    this.networkService.getNetworkMetrics().pipe(takeUntil(this.unsubscribe)).subscribe({
      next: (metrics) => {
        this.currentMetrics = metrics;
        this.connectionStatus = this.wsService.connectionStatus() ? 'websocket' : 'http';
        this.updateChartsWithRealData(metrics);

      },
      error: (error) => {
        console.error('❌ Error in event stream:', error);
        this.connectionStatus = 'disconnected';
      }
    })
  }

  private updateChartsWithRealData(metrics: NetworkMetrics): void {

    // Force Angular change detection for template updates
    // setTimeout(() => {
    // IP Packet Gauge Chart güncelle
    if (this.packetChart) {
      const ipInK = Math.round(metrics.packets.ipIn / 1000);
      const ipOutK = Math.round(metrics.packets.ipOut / 1000);
      const totalK = ipInK + ipOutK;

      // Maksimum değeri belirle (dinamik veya sabit)
      const maxValue = Math.max(10000, totalK + 1000); // En az 10M, veya mevcut + 1M

      // Percentage hesapla
      const ipInPercentage = Math.round((ipInK / maxValue) * 100);
      const ipOutPercentage = Math.round((ipOutK / maxValue) * 100);

      // Gauge chart'u güncelle
      this.packetChart.updateSeries([ipInPercentage, ipOutPercentage]);

      // Custom data labels için chart options'u güncelle
      this.packetChart.updateOptions({
        plotOptions: {
          radialBar: {
            dataLabels: {
              value: {
                formatter: function (val: number, opts: any) {
                  const seriesIndex = opts.seriesIndex;
                  return seriesIndex === 0 ? `${ipInK}K` : `${ipOutK}K`;
                }
              },
              total: {
                formatter: function (w: any) {
                  return `${totalK}K`;
                }
              }
            }
          }
        }
      });
    }

    // TCP Connection Chart güncelle
    if (this.connectionChart) {
      this.connectionChart.updateSeries([metrics.connections.tcp]);
    }

    // Protocol Chart güncelle
    if (this.protocolChart) {
      const udpFormatted = Math.round(metrics.connections.udp / 100);

      this.protocolChart.updateSeries([
        {
          name: 'UDP Datagrams',
          data: [udpFormatted]
        },
        {
          name: 'ICMP Messages',
          data: [metrics.packets.icmpIn]
        }
      ]);
    }

    // Device Status güncelle
    if (this.statusChart) {
      this.statusChart.updateSeries([
        metrics.deviceStatus.online,
        metrics.deviceStatus.warning,
        metrics.deviceStatus.offline
      ]);
    }
    // }, 0);
  }

  private initializeCharts(): void {
    this.createPacketChart();
    this.createConnectionChart();
    this.createProtocolChart();
    this.createStatusChart();
  }

  private createPacketChart(): void {
    const options = {
      series: [75, 85], // IP In ve IP Out için percentage değerleri
      chart: {
        type: 'radialBar',
        height: 350,
        animations: {
          enabled: true,
          easing: 'easeinout',
          dynamicAnimation: {
            speed: 1000
          }
        },
        toolbar: {
          show: false
        }
      },
      colors: ['#3498db', '#e74c3c'],
      plotOptions: {
        radialBar: {
          dataLabels: {
            name: {
              fontSize: '16px',
              fontWeight: 600,
              offsetY: -10
            },
            value: {
              fontSize: '14px',
              fontWeight: 500,
              offsetY: 5,
              formatter: function (val: number, opts: any) {
                const seriesIndex = opts.seriesIndex;
                // IP In ve IP Out değerlerini göster
                return seriesIndex === 0 ? '8404K' : '8976K';
              }
            },
            total: {
              show: true,
              label: 'Total Traffic',
              fontSize: '14px',
              fontWeight: 600,
              formatter: function (w: any) {
                return '17380K'; // IP In + IP Out
              }
            }
          },
          hollow: {
            size: '40%'
          },
          track: {
            background: '#f1f2f6',
            strokeWidth: '15px'
          },
          barLabels: {
            enabled: true,
            useSeriesColors: true,
            offsetX: -8,
            fontSize: '12px',
            formatter: function (seriesName: string, opts: any) {
              return seriesName + ': ' + opts.w.globals.series[opts.seriesIndex] + '%';
            }
          }
        }
      },
      labels: ['IP In (K packets)', 'IP Out (K packets)'],
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '12px',
        fontWeight: 500,
        markers: {
          width: 8,
          height: 8
        }
      }
    };

    this.packetChart = new ApexCharts(document.querySelector("#packet-chart"), options);
    this.packetChart.render();
  }

  private createConnectionChart(): void {
    const options = {
      series: [1],
      chart: {
        type: 'radialBar',
        height: 300
      },
      colors: ['#2ecc71'],
      plotOptions: {
        radialBar: {
          hollow: {
            size: '60%'
          },
          dataLabels: {
            show: true,
            name: {
              show: true,
              fontSize: '16px',
              fontWeight: 600,
              offsetY: 8
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 700,
              offsetY: -8,
              formatter: function (val: number) {
                return val.toString();
              }
            }
          },
          track: {
            background: '#f1f2f6',
            strokeWidth: '10px'
          }
        }
      },
      labels: ['TCP Connections']
    };

    this.connectionChart = new ApexCharts(document.querySelector("#connection-chart"), options);
    this.connectionChart.render();
  }

  private createProtocolChart(): void {
    const options = {
      series: [
        {
          name: 'UDP Datagrams',
          data: [55]
        },
        {
          name: 'ICMP Messages',
          data: [321]
        }
      ],
      chart: {
        type: 'bar',
        height: 300,
        toolbar: {
          show: false
        }
      },
      colors: ['#9b59b6', '#f39c12'],
      xaxis: {
        categories: ['Current Traffic']
      },
      yaxis: {
        title: {
          text: 'Message Count'
        }
      },
      legend: {
        position: 'top'
      },
      dataLabels: {
        enabled: true
      }
    };

    this.protocolChart = new ApexCharts(document.querySelector("#protocol-chart"), options);
    this.protocolChart.render();
  }

  private createStatusChart(): void {
    const options = {
      series: [1, 0, 0],
      chart: {
        type: 'donut',
        height: 300
      },
      colors: ['#2ecc71', '#f39c12', '#e74c3c'],
      labels: ['Online', 'Warning', 'Offline'],
      legend: {
        position: 'bottom'
      },
      plotOptions: {
        pie: {
          donut: {
            size: '60%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '16px',
                fontWeight: 600
              },
              value: {
                show: true,
                fontSize: '24px',
                fontWeight: 700
              },
              total: {
                show: true,
                label: 'Devices',
                fontSize: '16px',
                fontWeight: 600,
                formatter: function (w: any) {
                  const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                  return total.toString();
                }
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number, opts: any) {
          return opts.w.config.series[opts.seriesIndex];
        }
      }
    };

    this.statusChart = new ApexCharts(document.querySelector("#status-chart"), options);
    this.statusChart.render();
  }

  ngOnDestroy(): void {
    // Unsubscribe from all observables
    this.unsubscribe.next();
    this.unsubscribe.complete();

    // Clean up charts
    if (this.packetChart) this.packetChart.destroy();
    if (this.connectionChart) this.connectionChart.destroy();
    if (this.protocolChart) this.protocolChart.destroy();
    if (this.statusChart) this.statusChart.destroy();
  }
}

// Default export for lazy loading
export default DashboardComponent;
