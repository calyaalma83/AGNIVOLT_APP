import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { auth } from 'src/app/firebase-init';
import {
  onAuthStateChanged,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithPopup,
} from 'firebase/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  userName: string = 'Pengguna';
  userEmail: string = 'email@example.com';
  userInitial: string = '?';
  avatarColor: string = '#4caf50';
  colorList = [
    '#f44336', '#e91e63', '#9c27b0',
    '#3f51b5', '#2196f3', '#009688',
    '#4caf50', '#ff9800', '#795548',
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const name = user.displayName || 'Pengguna';
        const email = user.email || '';
        const initial = name.charAt(0).toUpperCase();

        this.userName = name;
        this.userEmail = email;
        this.userInitial = initial;
        this.avatarColor = this.getColorFromName(name);
      } else {
        this.router.navigate(['/register']);
      }
    });
  }

  getColorFromName(name: string): string {
    if (!name) return this.colorList[0];
    const index = name.charCodeAt(0) % this.colorList.length;
    return this.colorList[index];
  }

  async deleteAccount() {
    const user = auth.currentUser;
    if (!user) return;

    const yakin = confirm('Apakah anda yakin ingin menghapus akun ini?');
    if (!yakin) return;

    try {
      const providerId = user.providerData[0]?.providerId;

      if (providerId === 'google.com') {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, provider);
      } else {
        const password = prompt('Masukkan password untuk konfirmasi hapus akun:');
        if (!password) return alert('Password diperlukan untuk hapus akun.');
        const credential = EmailAuthProvider.credential(user.email!, password);
        await reauthenticateWithCredential(user, credential);
      }

      await deleteUser(user);
      alert('Akun berhasil dihapus!');
      this.router.navigate(['/register']);
    } catch (err: any) {
      alert('Gagal hapus akun: ' + err.message);
    }
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}