import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
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
  imports: [IonicModule, CommonModule, RouterModule],
})
export class RegisterPage {
  @ViewChild('nameField', { static: false }) nameField!: ElementRef;
  @ViewChild('emailField', { static: false }) emailField!: ElementRef;
  @ViewChild('passwordField', { static: false }) passwordField!: ElementRef;

  name = '';
  email = '';
  password = '';

  constructor(
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {
    console.log('RegisterPage initialized');
  }

  onNameChange(event: any) {
    this.name = event.target.value;
    console.log('Name changed:', this.name);
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

  // ✅ Validasi password kuat
  validatePassword(password: string): boolean {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]).{8,}$/;
    return regex.test(password);
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

  async handleRegister() {
    console.log('Register button clicked');
    console.log('Name:', this.name);
    console.log('Email:', this.email);
    console.log('Password:', this.password);

    if (!this.name || !this.email || !this.password) {
      console.log('Validation failed: empty fields');
      this.showToast('Semua kolom harus diisi!');
      return;
    }

    // ✅ Validasi password
    if (!this.validatePassword(this.password)) {
      console.log('Validation failed: weak password');
      this.showToast(
        'Password harus minimal 8 karakter, mengandung huruf, angka, dan simbol.'
      );
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Sedang mendaftarkan...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      console.log('Attempting Firebase registration...');
      const userCred = await createUserWithEmailAndPassword(
        auth,
        this.email,
        this.password
      );
      await updateProfile(userCred.user, { displayName: this.name });

      await loading.dismiss();
      console.log('Registration successful');
      this.showToast('Registrasi berhasil!', 'success');
      this.router.navigateByUrl('/dashboard', { replaceUrl: true });
    } catch (error: any) {
      await loading.dismiss();
      console.error('Registration error:', error);
      this.showToast(this.getFirebaseErrorMessage(error.code));
    }
  }

  async handleGoogleRegister() {
    console.log('Google register button clicked');
    const provider = new GoogleAuthProvider();

    const loading = await this.loadingCtrl.create({
      message: 'Login dengan Google...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      console.log('Attempting Google registration...');
      await signInWithPopup(auth, provider);
      await loading.dismiss();
      console.log('Google registration successful');
      this.showToast('Login Google berhasil!', 'success');
      this.router.navigateByUrl('/dashboard', { replaceUrl: true });
    } catch (error: any) {
      await loading.dismiss();
      console.error('Google registration error:', error);
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