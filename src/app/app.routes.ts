import { Routes } from '@angular/router';
import { AuthGuard } from './features/user-management/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/network-monitoring/components/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./features/user-management/components/register/register.component')
      .then(m => m.RegisterComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/user-management/components/login/login.component')
      .then(m => m.LoginComponent)
  }
];
