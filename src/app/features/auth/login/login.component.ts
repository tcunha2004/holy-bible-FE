import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = false;
  error = '';
  showErrorModal = false;
  modalErrors: string[] = [];

  submit(): void {
    if (this.form.invalid) {
      this.modalErrors = this.collectErrors();
      this.showErrorModal = true;
      return;
    }

    this.loading = true;
    this.error = '';

    const { email, password } = this.form.getRawValue();

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: () => this.router.navigate(['/bible']),
      error: () => {
        this.error = 'Email ou senha incorretos.';
        this.loading = false;
      },
    });
  }

  private collectErrors(): string[] {
    const errors: string[] = [];
    const { email, password } = this.form.controls;

    if (email.errors?.['required']) errors.push('Informe seu email.');
    else if (email.errors?.['email']) errors.push('Informe um email válido.');

    if (password.errors?.['required']) errors.push('Informe sua senha.');

    return errors;
  }
}
