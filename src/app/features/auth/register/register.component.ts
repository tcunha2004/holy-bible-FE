import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  });

  loading = signal(false);
  error = signal('');
  showErrorModal = signal(false);
  modalErrors = signal<string[]>([]);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  submit(): void {
    if (this.form.invalid) {
      this.modalErrors.set(this.collectErrors());
      this.showErrorModal.set(true);
      return;
    }

    const { name, email, password, confirmPassword } = this.form.getRawValue();

    if (password !== confirmPassword) {
      this.modalErrors.set(['As senhas não coincidem.']);
      this.showErrorModal.set(true);
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.showErrorModal.set(false);

    this.authService.register({ name: name!, email: email!, password: password! }).subscribe({
      next: () => {
        this.authService.startOnboarding();
        this.router.navigate(['/onboarding']);
      },
      error: (err: HttpErrorResponse) => {
        const messages = this.extractServerErrors(err);
        this.modalErrors.set(messages);
        this.showErrorModal.set(true);
        this.loading.set(false);
      },
    });
  }

  private extractServerErrors(err: HttpErrorResponse): string[] {
    const message = err.error?.message;

    if (Array.isArray(message) && message.length) {
      return message;
    }

    if (typeof message === 'string' && message) {
      return [message];
    }

    return ['Não foi possível criar a conta. Tente novamente.'];
  }

  private collectErrors(): string[] {
    const errors: string[] = [];
    const { name, email, password, confirmPassword } = this.form.controls;

    if (name.errors?.['required']) errors.push('Informe seu nome.');
    if (email.errors?.['required']) errors.push('Informe seu email.');
    else if (email.errors?.['email']) errors.push('Informe um email válido.');
    if (password.errors?.['required']) errors.push('Informe sua senha.');
    else if (password.errors?.['minlength']) errors.push('A senha deve ter pelo menos 6 caracteres.');
    if (confirmPassword.errors?.['required']) errors.push('Confirme sua senha.');

    return errors;
  }
}
