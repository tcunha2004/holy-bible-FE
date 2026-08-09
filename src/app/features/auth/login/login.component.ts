import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ServiceUnavailableModalComponent } from '../../../shared/components/service-unavailable-modal/service-unavailable-modal.component';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, ServiceUnavailableModalComponent],
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

  loading = signal(false);
  error = signal('');
  showErrorModal = signal(false);
  modalErrors = signal<string[]>([]);
  showPassword = signal(false);

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  submit(): void {
    if (this.form.invalid) {
      this.modalErrors.set(this.collectErrors());
      this.showErrorModal.set(true);
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.showErrorModal.set(false);

    const { email, password } = this.form.getRawValue();

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: () => this.router.navigate(['/bible']),
      error: (err: HttpErrorResponse) => {
        this.error.set(
          err.status === 401
            ? 'Email ou senha incorretos.'
            : 'Ocorreu um erro inesperado. Tente novamente.',
        );
        this.loading.set(false);
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
