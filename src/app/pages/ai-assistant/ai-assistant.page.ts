import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { auth } from 'src/app/firebase-init';
import { onAuthStateChanged } from 'firebase/auth';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './ai-assistant.page.html',
  styleUrls: ['./ai-assistant.page.scss'],
})
export class AiAssistantPage {
  messages: { sender: 'user' | 'ai'; text: string; avatar: string }[] = [
    {
      sender: 'ai',
      text: 'Selamat datang! Saya adalah asisten AI untuk sistem PLTMH Anda. Bagaimana saya bisa membantu Anda hari ini?',
      avatar: '🤖',
    },
  ];

  chatInput = '';
  isLoading = false;
  userInitial = 'U';

  private GEMINI_API_KEY = 'AIzaSyBE_27Q5mMbOOzXDbnTpSarb69xMoBrppo';
  private GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.GEMINI_API_KEY}`;

  constructor(private navCtrl: NavController) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.userInitial =
          user.displayName?.[0]?.toUpperCase() ||
          user.email?.[0]?.toUpperCase() ||
          'U';
      }
    });
  }

  closeChat() {
    this.navCtrl.back();
  }

  async sendMessage() {
    const msg = this.chatInput.trim();
    if (!msg) return;

    this.messages.push({ sender: 'user', text: msg, avatar: this.userInitial });
    this.chatInput = '';
    this.isLoading = true;

    try {
      const response = await this.generateAIResponse(msg);
      this.messages.push({ sender: 'ai', text: response, avatar: '🤖' });
    } catch (error) {
      this.messages.push({
        sender: 'ai',
        text: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        avatar: '🤖',
      });
      console.error('Error:', error);
    } finally {
      this.isLoading = false;
    }
  }

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
}