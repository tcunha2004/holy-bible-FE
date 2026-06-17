import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { GuideService } from '../../core/services/guide.service';
import { HowToUseModalComponent } from '../../shared/components/how-to-use-modal/how-to-use-modal.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, HowToUseModalComponent],
  templateUrl: './main-layout.component.html',
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly guide = inject(GuideService);

  menuOpen = signal(false);
  userName = this.authService.getUserName();
  userInitials = this.buildInitials(this.userName);

  private buildInitials(name: string | null): string {
    if (!name) return '';

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  logout(): void {
    this.menuOpen.set(false);
    this.authService.logout();
  }

  openGuide(): void {
    this.menuOpen.set(false);
    this.guide.show();
  }
}
