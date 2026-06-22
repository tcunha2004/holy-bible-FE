import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateUserRequest,
  LoginRequest,
  LoginResponse,
  VerifyCodeRequest,
} from '../../shared/models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenKey = 'holy_bible_token';
  private readonly onboardingKey = 'holy_bible_onboarding';
  private readonly pendingEmailKey = 'holy_bible_pending_email';
  private readonly apiUrl = environment.apiUrl;

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(tap(({ access_token }) => this.saveToken(access_token)));
  }

  startRegistration(data: CreateUserRequest): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/auth/register/start`, data)
      .pipe(tap(() => this.setPendingEmail(data.email)));
  }

  verifyCode(data: VerifyCodeRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/register/verify`, data).pipe(
      tap(({ access_token }) => {
        this.saveToken(access_token);
        this.clearPendingEmail();
      }),
    );
  }

  resendCode(email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/register/resend`, { email });
  }

  private setPendingEmail(email: string): void {
    sessionStorage.setItem(this.pendingEmailKey, email);
  }

  getPendingEmail(): string | null {
    return sessionStorage.getItem(this.pendingEmailKey);
  }

  private clearPendingEmail(): void {
    sessionStorage.removeItem(this.pendingEmailKey);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.router.navigate(['/auth/login']);
  }

  startOnboarding(): void {
    sessionStorage.setItem(this.onboardingKey, '1');
  }

  canOnboard(): boolean {
    return sessionStorage.getItem(this.onboardingKey) === '1';
  }

  finishOnboarding(): void {
    sessionStorage.removeItem(this.onboardingKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();

    if (!token || this.isTokenExpired(token)) {
      localStorage.removeItem(this.tokenKey);
      return false;
    }

    return true;
  }

  getUserName(): string | null {
    const token = this.getToken();
    return token ? (this.decodeToken(token)?.name ?? null) : null;
  }

  getUserId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    const payload = this.decodeToken(token);
    return payload?.sub ?? payload?.name ?? null;
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);

    if (!payload?.exp) {
      return true;
    }

    return payload.exp * 1000 <= Date.now();
  }

  private decodeToken(token: string): { exp?: number; name?: string; sub?: string } | null {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  private saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }
}
