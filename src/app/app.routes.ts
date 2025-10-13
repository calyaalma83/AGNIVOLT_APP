import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then( m => m.RegisterPage)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then( m => m.DashboardPage)
  },
  {
    path: 'ai-assistant',
    loadComponent: () => import('./pages/ai-assistant/ai-assistant.page').then( m => m.AiAssistantPage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.page').then( m => m.ProfilePage)
  },
];
