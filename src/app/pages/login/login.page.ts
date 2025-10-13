import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { auth } from 'src/app/firebase-init';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { ToastController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  email = '';
  password = '';
  showPassword = false;

  constructor(
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async showToast(message: string, color: string = 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'bottom',
    });
    toast.present();
  }

  async onLogin(e: Event) {
    e.preventDefault();

    if (!this.email || !this.password) {
      this.showToast('Email dan password harus diisi!');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Sedang login...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      await signInWithEmailAndPassword(auth, this.email, this.password);
      await loading.dismiss();
      this.showToast('Login berhasil!', 'success');
      this.router.navigateByUrl('/dashboard', { replaceUrl: true });
    } catch (error: any) {
      await loading.dismiss();
      this.showToast(this.getFirebaseErrorMessage(error.code));
    }
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();

    const loading = await this.loadingCtrl.create({
      message: 'Login dengan Google...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      await signInWithPopup(auth, provider);
      await loading.dismiss();
      this.showToast('Login Google berhasil!', 'success');
      this.router.navigateByUrl('/dashboard', { replaceUrl: true });
    } catch (error: any) {
      await loading.dismiss();
      this.showToast(this.getFirebaseErrorMessage(error.code));
    }
  }

  private getFirebaseErrorMessage(code: string): string {
    switch (code) {
      case 'auth/invalid-email':
        return 'Format email tidak valid.';
      case 'auth/user-not-found':
        return 'Akun tidak ditemukan.';
      case 'auth/wrong-password':
        return 'Password salah.';
      case 'auth/popup-closed-by-user':
        return 'Login Google dibatalkan.';
      default:
        return 'Terjadi kesalahan. Coba lagi.';
    }
  }
}