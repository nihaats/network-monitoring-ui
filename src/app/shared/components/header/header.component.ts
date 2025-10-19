import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { AuthService } from '../../../features/user-management/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);

  isLoggedIn: boolean = false;

  constructor() {
    effect(() => {
      this.isLoggedIn = this.authService.authenticated();
      console.log('HeaderComponent - isLoggedIn changed: ', this.isLoggedIn);
    });
  }

  logout() {
    this.authService.logout();
  }
}
