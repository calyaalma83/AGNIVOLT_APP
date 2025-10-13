import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { auth } from 'src/app/firebase-init';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
})
export class RegisterPage {
  name = '';
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

  async onRegister(e: Event) {
    e.preventDefault();

    if (!this.name || !this.email || !this.password) {
      this.showToast('Semua kolom harus diisi!');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Sedang mendaftarkan...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      const userCred = await createUserWithEmailAndPassword(auth, this.email, this.password);
      await updateProfile(userCred.user, { displayName: this.name });

      await loading.dismiss();
      this.showToast('Registrasi berhasil!', 'success');
      this.router.navigateByUrl('/dashboard', { replaceUrl: true });
    } catch (error: any) {
      await loading.dismiss();
      this.showToast(this.getFirebaseErrorMessage(error.code));
    }
  }

  async registerWithGoogle() {
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
      case 'auth/email-already-in-use':
        return 'Email sudah terdaftar.';
      case 'auth/invalid-email':
        return 'Format email tidak valid.';
      case 'auth/weak-password':
        return 'Password terlalu lemah.';
      case 'auth/popup-closed-by-user':
        return 'Login Google dibatalkan.';
      default:
        return 'Terjadi kesalahan. Coba lagi.';
    }
  }
}