import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { auth } from 'src/app/firebase-init';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithRedirect, 
  getRedirectResult, 
  User, // Mengimpor tipe User
} from 'firebase/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [IonicModule, CommonModule, RouterModule],
})
export class RegisterPage implements OnInit { // Menggunakan OnInit
  @ViewChild('nameField', { static: false }) nameField!: ElementRef;
  @ViewChild('emailField', { static: false }) emailField!: ElementRef;
  @ViewChild('passwordField', { static: false }) passwordField!: ElementRef;

  name = '';
  email = '';
  password = '';
  
  // FLAG KRITIS: Mencegah pemrosesan ganda saat redirect
  private isRedirectProcessing = false; 

  constructor(
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  // Panggil fungsi penanganan redirect di hook OnInit
  ngOnInit() {
    this.handleGoogleRedirectResult();
  }

  onNameChange(event: any) {
    this.name = event.target.value;
  }

  onEmailChange(event: any) {
    this.email = event.target.value;
  }

  onPasswordChange(event: any) {
    this.password = event.target.value;
  }

  togglePasswordVisibility() {
    const passwordInput = this.passwordField?.nativeElement;
    if (passwordInput) {
      passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
      const icon = passwordInput.parentElement?.querySelector('ion-icon');
      if (icon) {
        icon.setAttribute('name', passwordInput.type === 'password' ? 'eye-outline' : 'eye-off-outline');
      }
    }
  }

  /**
   * Menggunakan standar minimum Firebase (6 karakter, harus ada huruf dan angka).
   */
  validatePassword(password: string): boolean {
    const regex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/; 
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
    console.log('Register button clicked (Email/Password)');

    if (!this.name || !this.email || !this.password) {
      this.showToast('Semua kolom harus diisi!');
      return;
    }

    if (!this.validatePassword(this.password)) {
      this.showToast(
        'Password harus minimal 6 karakter, mengandung huruf dan angka.'
      );
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Sedang mendaftarkan...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        this.email,
        this.password
      );
      // Update profile dengan nama yang dimasukkan di form
      await updateProfile(userCred.user, { displayName: this.name });

      await loading.dismiss();
      this.showToast('Registrasi berhasil!', 'success');
      this.router.navigateByUrl('/dashboard', { replaceUrl: true });
    } catch (error: any) {
      await loading.dismiss();
      console.error('Registration error:', error);
      this.showToast(this.getFirebaseErrorMessage(error.code));
    }
  }

  /**
   * Menggunakan signInWithRedirect untuk aplikasi Ionic/Angular yang di-deploy.
   */
  async handleGoogleRegister() {
    console.log('Google register button clicked - initiating redirect');
    const provider = new GoogleAuthProvider();

    try {
      await signInWithRedirect(auth, provider); 
    } catch (error: any) {
      console.error('Google registration redirect error:', error);
      this.showToast(this.getFirebaseErrorMessage(error.code));
    }
  }

  /**
   * Fungsi untuk menangani hasil setelah redirect Google selesai.
   */
  async handleGoogleRedirectResult() {
    // Jika sedang diproses, keluar segera
    if (this.isRedirectProcessing) {
        return;
    }
    this.isRedirectProcessing = true; // Set flag: Sedang diproses

    let loading: HTMLIonLoadingElement | null = null;

    try {
      // 1. Coba mendapatkan hasil redirect.
      const result = await getRedirectResult(auth);
      
      if (result) {
        // 2. Jika ada hasil (berarti kembali dari Google), tampilkan loading.
        loading = await this.loadingCtrl.create({
            message: 'Memproses login Google...',
            spinner: 'crescent',
        });
        await loading.present();

        // 3. Sukses, navigasi.
        console.log('Google Redirect successful:', result.user.uid);
        this.showToast('Login Google berhasil!', 'success');
        this.router.navigateByUrl('/dashboard', { replaceUrl: true });
      }
      // Jika result null, tidak ada redirect, lanjut normal.
      
    } catch (error: any) {
      // 4. Tangani error otentikasi.
      console.error('Google Redirect error:', error);
      
      // Tampilkan loading singkat untuk memastikan pesan error terlihat
      loading = await this.loadingCtrl.create({
            message: 'Terjadi Kesalahan Otentikasi...',
            spinner: 'crescent',
            duration: 1500 
        });
      await loading.present(); // Tampilkan
      
      this.showToast(this.getFirebaseErrorMessage(error.code));
      
    } finally {
      // 5. Pastikan loading didismiss dan flag direset
      if (loading) {
          await loading.dismiss();
      }
      this.isRedirectProcessing = false; // Reset flag: Selesai diproses
    }
  }


  private getFirebaseErrorMessage(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Email sudah terdaftar.';
      case 'auth/invalid-email':
        return 'Format email tidak valid.';
      case 'auth/weak-password':
        return 'Password terlalu lemah (minimal 6 karakter).';
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return 'Login dibatalkan atau Pop-up diblokir.';
      default:
        return 'Terjadi kesalahan. Coba lagi.';
    }
  }
}