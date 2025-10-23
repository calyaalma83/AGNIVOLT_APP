import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { auth } from 'src/app/firebase-init';
import { onAuthStateChanged } from 'firebase/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements AfterViewInit {
  @ViewChild('chatMessages') chatMessagesRef!: ElementRef;

  chartTitle = 'Grafik Monitoring Real-time';
  userInitial = '?';
  userName = 'User';
  chart: Chart | null = null;

  // Profile menu
  showProfileMenu = false;

  // AI Assistant variables
  showAiAssistant = false;
  aiMessages: { sender: 'user' | 'ai'; text: string; avatar: string }[] = [
    {
      sender: 'ai',
      text: 'Selamat datang! Saya adalah asisten AI untuk sistem PLTMH Anda. Bagaimana saya bisa membantu Anda hari ini?',
      avatar: '🤖',
    },
  ];
  chatInput = '';
  isAiLoading = false;
  private GEMINI_API_KEY = 'AIzaSyBE_27Q5mMbOOzXDbnTpSarb69xMoBrppo';
  private GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.GEMINI_API_KEY}`;

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
        this.userName = user.displayName || user.email?.split('@')[0] || 'User';
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

  // 👤 Profile Menu Toggle
  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  // 👤 Navigasi profil
  openProfile() {
    this.showProfileMenu = false;
    this.router.navigate(['/profile']);
  }

  // ⚙️ Settings (placeholder)
  openSettings() {
    this.showProfileMenu = false;
    // TODO: Implement settings page
    console.log('Settings clicked');
  }

  // 🚪 Logout
  async logout() {
    this.showProfileMenu = false;
    try {
      await auth.signOut();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // 💬 Open/Close AI Assistant
  openAiAssistant() {
    this.showAiAssistant = true;
    setTimeout(() => this.scrollChatToBottom(), 300);
  }

  closeAiAssistant() {
    this.showAiAssistant = false;
  }

  // 📤 Send AI Message
  async sendAiMessage() {
    const msg = this.chatInput.trim();
    if (!msg) return;

    this.aiMessages.push({ sender: 'user', text: msg, avatar: this.userInitial });
    this.chatInput = '';
    this.isAiLoading = true;
    this.scrollChatToBottom();

    try {
      const response = await this.generateAIResponse(msg);
      this.aiMessages.push({ sender: 'ai', text: response, avatar: '🤖' });
      this.scrollChatToBottom();
    } catch (error) {
      this.aiMessages.push({
        sender: 'ai',
        text: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        avatar: '🤖',
      });
      console.error('Error:', error);
      this.scrollChatToBottom();
    } finally {
      this.isAiLoading = false;
    }
  }

  // 🤖 Generate AI Response
  async generateAIResponse(message: string): Promise<string> {
    const systemContext = `
Anda adalah asisten AI untuk sistem monitoring PLTMH (Pembangkit Listrik Tenaga Mikro Hidro) bernama Agnivolt.

Tugas Anda:
1. Membantu user memahami data monitoring PLTMH
2. Memberikan insight tentang performa sistem
3. Menjawab pertanyaan tentang status, efisiensi, dan kondisi PLTMH
4. Memberikan saran maintenance jika diperlukan
5. Menjelaskan data dengan bahasa yang mudah dipahami

Jawab pertanyaan user dengan singkat, jelas, dan profesional dalam Bahasa Indonesia.
`;

    const requestBody = {
      contents: [
        {
          parts: [{ text: systemContext + '\n\nPertanyaan user: ' + message }],
        },
      ],
      generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
    };

    const response = await fetch(this.GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Tidak ada respons dari AI.';
  }

  // 📜 Scroll to bottom of chat
  private scrollChatToBottom() {
    setTimeout(() => {
      if (this.chatMessagesRef?.nativeElement) {
        this.chatMessagesRef.nativeElement.scrollTop = this.chatMessagesRef.nativeElement.scrollHeight;
      }
    }, 100);
  }
}