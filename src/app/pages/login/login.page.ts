import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
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
  imports: [IonicModule, CommonModule, RouterModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  @ViewChild('emailField', { static: false }) emailField!: ElementRef;
  @ViewChild('passwordField', { static: false }) passwordField!: ElementRef;

  email = '';
  password = '';

  constructor(
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {
    console.log('LoginPage initialized');
  }

  onEmailChange(event: any) {
    this.email = event.target.value;
    console.log('Email changed:', this.email);
  }

  onPasswordChange(event: any) {
    this.password = event.target.value;
    console.log('Password changed:', this.password);
  }

  togglePasswordVisibility() {
    console.log('Toggle password clicked');
    const passwordInput = this.passwordField?.nativeElement;
    if (passwordInput) {
      passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
      const icon = passwordInput.parentElement?.querySelector('ion-icon');
      if (icon) {
        icon.setAttribute('name', passwordInput.type === 'password' ? 'eye-outline' : 'eye-off-outline');
      }
    }
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

  async handleLogin() {
    console.log('Login button clicked');
    console.log('Email:', this.email);
    console.log('Password:', this.password);

    if (!this.email || !this.password) {
      console.log('Validation failed: empty fields');
      this.showToast('Email dan password harus diisi!');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Sedang login...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      console.log('Attempting Firebase login...');
      await signInWithEmailAndPassword(auth, this.email, this.password);
      await loading.dismiss();
      console.log('Login successful');
      this.showToast('Login berhasil!', 'success');
      this.router.navigateByUrl('/dashboard', { replaceUrl: true });
    } catch (error: any) {
      await loading.dismiss();
      console.error('Login error:', error);
      this.showToast(this.getFirebaseErrorMessage(error.code));
    }
  }

  async handleGoogleLogin() {
    console.log('Google login button clicked');
    const provider = new GoogleAuthProvider();

    const loading = await this.loadingCtrl.create({
      message: 'Login dengan Google...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      console.log('Attempting Google login...');
      await signInWithPopup(auth, provider);
      await loading.dismiss();
      console.log('Google login successful');
      this.showToast('Login Google berhasil!', 'success');
      this.router.navigateByUrl('/dashboard', { replaceUrl: true });
    } catch (error: any) {
      await loading.dismiss();
      console.error('Google login error:', error);
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