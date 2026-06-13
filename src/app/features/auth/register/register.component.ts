import { Component, inject } from '@angular/core';
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

    const { name, email, password, confirmPassword } = this.form.getRawValue();

    if (password !== confirmPassword) {
      this.modalErrors = ['As senhas não coincidem.'];
      this.showErrorModal = true;
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.register({ name: name!, email: email!, password: password! }).subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: () => {
        this.error = 'Não foi possível criar a conta. Tente novamente.';
        this.loading = false;
      },
    });
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
