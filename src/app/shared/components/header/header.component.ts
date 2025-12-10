import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../features/user-management/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private readonly unsubscribe = new Subject<void>();
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

  downloadZipFile(): void {
    this.authService.downloadZip().pipe(takeUntil(this.unsubscribe)).subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "archive.zip";  // İndirilecek dosya adı
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

}
