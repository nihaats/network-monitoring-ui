import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NgSnackbarComponent } from '../../../../design-system/components/ng-snackbar/ng-snackbar.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, NgSnackbarComponent, MatButtonModule, MatFormFieldModule, MatInputModule, MatSnackBarModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly unsubscribe = new Subject<void>();
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loginForm!: FormGroup;
  errorMessage: string = '';

  ngOnInit(): void {
    this.createRegisterForm();
  }

  private createRegisterForm() {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  login() {
    const model = {
      username: this.loginForm.value.username,
      password: this.loginForm.value.password,
    };
    this.authService.login(model).pipe(takeUntil(this.unsubscribe)).subscribe({
      next: (response) => {
        this.router.navigate(['/dashboard']);
        console.log('response: ', response);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Login failed. Please try again.';
      }
    });
  }

  get username(): AbstractControl | null {
    return this.loginForm.get('username');
  }

  get password(): AbstractControl | null {
    return this.loginForm.get('password');
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
