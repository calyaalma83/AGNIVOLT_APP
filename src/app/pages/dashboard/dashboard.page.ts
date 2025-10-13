import { Component, AfterViewInit } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { auth } from 'src/app/firebase-init';
import { onAuthStateChanged } from 'firebase/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements AfterViewInit {
  chartTitle = 'Grafik Monitoring Real-time';
  userInitial = '?';
  chart: Chart | null = null;

  realtimeData = {
    labels: [] as string[],
    voltage: [] as number[],
    current: [] as number[],
    power: [] as number[],
    rpm: [] as number[],
  };

  constructor(private router: Router) {}

  ngAfterViewInit() {
    // 🔒 Cek user login
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.userInitial =
          user.displayName?.[0]?.toUpperCase() ||
          user.email?.[0]?.toUpperCase() ||
          '?';
        this.initChart();
        this.listenToRealtimeData(); // nanti nyambung ke Firebase di sini
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  // 📊 Inisialisasi chart kosong
  initChart() {
    const ctx = document.getElementById('realtimeChart') as HTMLCanvasElement | null;
    if (!ctx) return;
    this.chart = new Chart(ctx, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: 10 },
        plugins: {
          legend: { position: 'top' },
        },
        scales: {
          y: { title: { display: true, text: 'V / A / W' } },
          y1: {
            position: 'right',
            title: { display: true, text: 'RPM' },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
  }

  // 🔁 Listener ke Firebase (nanti lo isi di sini)
  listenToRealtimeData() {
    // Contoh nanti:
    // const dbRef = ref(getDatabase(), 'sensorData');
    // onValue(dbRef, (snapshot) => {
    //   const data = snapshot.val();
    //   this.updateUI(data);
    // });
  }

  // 🧠 Update UI (tegangan, arus, daya, rpm + chart)
  updateUI(data: { voltage: number; current: number; power: number; rpm: number }) {
    if (!this.chart) return;

    const now = new Date();
    const label = now.toLocaleTimeString();

    // Update nilai di UI
    document.getElementById('voltage')!.textContent = data.voltage.toFixed(1);
    document.getElementById('current')!.textContent = data.current.toFixed(1);
    document.getElementById('power')!.textContent = data.power.toFixed(0);
    document.getElementById('rpm')!.textContent = data.rpm.toFixed(0);

    // Masukin ke array data buat chart
    this.realtimeData.labels.push(label);
    this.realtimeData.voltage.push(data.voltage);
    this.realtimeData.current.push(data.current);
    this.realtimeData.power.push(data.power);
    this.realtimeData.rpm.push(data.rpm);

    // Biar data di chart nggak numpuk terus
    if (this.realtimeData.labels.length > 10) {
      (Object.keys(this.realtimeData) as (keyof typeof this.realtimeData)[]).forEach(
        (k) => this.realtimeData[k].shift()
      );
    }

    this.updateChart(this.realtimeData);
  }

  // 🔧 Update chart
  updateChart(dataset: {
    labels: string[];
    voltage: number[];
    current: number[];
    power: number[];
    rpm: number[];
  }) {
    if (!this.chart) return;
    this.chart.data.labels = dataset.labels;
    this.chart.data.datasets = [
      { label: 'Tegangan (V)', data: dataset.voltage, borderColor: '#e53e3e', tension: 0.4 },
      { label: 'Arus (A)', data: dataset.current, borderColor: '#3182ce', tension: 0.4 },
      { label: 'Daya (W)', data: dataset.power, borderColor: '#38a169', tension: 0.4 },
      { label: 'RPM', data: dataset.rpm, borderColor: '#d69e2e', yAxisID: 'y1', tension: 0.4 },
    ];
    this.chart.update();
  }

  // ✅ Tambahan sementara biar tombol tab nggak error
  switchChart(type: string, event: Event) {
    document.querySelectorAll('.tab-button').forEach((btn) =>
      btn.classList.remove('active')
    );
    (event.target as HTMLElement).classList.add('active');

    if (type === 'realtime') {
      this.chartTitle = 'Grafik Monitoring Real-time';
    } else if (type === 'daily') {
      this.chartTitle = 'Grafik Monitoring Harian';
    } else if (type === 'weekly') {
      this.chartTitle = 'Grafik Monitoring Mingguan';
    } 
  }

  // 👤 Navigasi profil
  openProfile() {
    this.router.navigate(['/profile']);
  }

  // 💬 Navigasi ke AI Assistant
  openAiAssistant() {
    this.router.navigate(['/ai-assistant']);
  }
}