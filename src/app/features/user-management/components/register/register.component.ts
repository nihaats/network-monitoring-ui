import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NgSnackbarComponent } from '../../../../design-system/components/ng-snackbar/ng-snackbar.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, NgSnackbarComponent, MatButtonModule, MatFormFieldModule, MatInputModule, MatSnackBarModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit, OnDestroy {
  private readonly unsubscribe = new Subject<void>();
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  message: string = '';
  registerForm!: FormGroup
  isRegistrationSuccess: boolean = false;

  ngOnInit(): void {
    this.message = '';
    this.createRegisterForm();
  }

  register() {
    const model = {
      username: this.registerForm.value.username,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
    };

    this.authService.register(model).pipe(takeUntil(this.unsubscribe)).subscribe({
      next: (response) => {
        this.isRegistrationSuccess = true;
        this.router.navigate(['/login']);
        this.message = response?.message || 'Registration successful';
      },
      error: (err) => {
        console.error('Registration failed', err);
        this.message = err?.error?.message || 'Registration failed';
        setTimeout(() => { this.message = ''; }, 2500);
      }
    });
  }

  private createRegisterForm() {
    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (confirmPassword.value && password.value !== confirmPassword.value) {
      this.confirmPassword?.setErrors({ mismatch: true });
    }

    return null;
  };

  get username(): AbstractControl | null {
    return this.registerForm.get('username');
  }

  get email(): AbstractControl | null {
    return this.registerForm.get('email');
  }

  get password(): AbstractControl | null {
    return this.registerForm.get('password');
  }

  get confirmPassword(): AbstractControl | null {
    return this.registerForm.get('confirmPassword');
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
