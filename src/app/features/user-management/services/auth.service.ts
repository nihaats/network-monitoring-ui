import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RegisterModel } from '../models/register.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  authenticated = signal<boolean>(false);

  register(model: RegisterModel): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/auth/signup', model)
  }

  login(model: { username: string; password: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/auth/signin', model, { withCredentials: true }).pipe(
      map(response => {
        this.authenticated.set(true);
        return response as any;
      }),
      catchError(err => {
        this.authenticated.set(false);
        console.error('Login failed', err);
        throw err;
      })
    );
  }

  logout(): void {
    this.http.post<any>(this.apiUrl + '/auth/signout', {}, { withCredentials: true }).subscribe({
      next: () => {
        this.authenticated.set(false);
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout failed', error);
      }
    });
  }

  checkAuthentication() {
    return this.http.get<{ authenticated: boolean }>(this.apiUrl + '/auth/check', { withCredentials: true }).pipe(
      map(response => {
        this.authenticated.set(response.authenticated);
        return response.authenticated;
      }),
      catchError(err => {
        this.authenticated.set(false);
        console.error('Auth check failed', err);
        return [false];
      })
    );
  }

  getIPAddress(): Observable<{ ipAddress: string }> {
    return this.http.get<{ ipAddress: string }>(`${this.apiUrl}/auth/ip-address`).pipe(
      map(response => {
        return response;
      }),
      catchError(err => {
        console.error('Failed to get IP address', err);
        throw err;
      })
    );
  }
}
