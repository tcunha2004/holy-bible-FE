import { Component, OnDestroy, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

const RESEND_COOLDOWN_SECONDS = 60;

@Component({
  selector: 'app-verify',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './verify.component.html',
})
export class VerifyComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = this.authService.getPendingEmail() ?? '';

  form = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  loading = signal(false);
  resending = signal(false);
  showErrorModal = signal(false);
  modalErrors = signal<string[]>([]);
  info = signal('');
  cooldown = signal(0);

  private intervalId?: ReturnType<typeof setInterval>;

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  submit(): void {
    if (this.form.invalid) {
      this.modalErrors.set(['Informe o código de 6 dígitos enviado para o seu e-mail.']);
      this.showErrorModal.set(true);
      return;
    }

    const { code } = this.form.getRawValue();

    this.loading.set(true);
    this.showErrorModal.set(false);
    this.info.set('');

    this.authService.verifyCode({ email: this.email, code: code! }).subscribe({
      next: () => {
        this.authService.startOnboarding();
        this.router.navigate(['/onboarding']);
      },
      error: (err: HttpErrorResponse) => {
        this.modalErrors.set(this.extractServerErrors(err));
        this.showErrorModal.set(true);
        this.loading.set(false);
      },
    });
  }

  resend(): void {
    if (this.cooldown() > 0 || this.resending()) {
      return;
    }

    this.resending.set(true);
    this.showErrorModal.set(false);
    this.info.set('');

    this.authService.resendCode(this.email).subscribe({
      next: () => {
        this.info.set('Enviamos um novo código para o seu e-mail.');
        this.startCooldown();
        this.resending.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.modalErrors.set(this.extractServerErrors(err));
        this.showErrorModal.set(true);
        this.resending.set(false);
      },
    });
  }

  private startCooldown(): void {
    this.cooldown.set(RESEND_COOLDOWN_SECONDS);
    clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.cooldown.update((v) => v - 1);
      if (this.cooldown() <= 0) {
        clearInterval(this.intervalId);
      }
    }, 1000);
  }

  private extractServerErrors(err: HttpErrorResponse): string[] {
    const message = err.error?.message;

    if (Array.isArray(message) && message.length) {
      return message;
    }

    if (typeof message === 'string' && message) {
      return [message];
    }

    return ['Não foi possível verificar o código. Tente novamente.'];
  }
}
