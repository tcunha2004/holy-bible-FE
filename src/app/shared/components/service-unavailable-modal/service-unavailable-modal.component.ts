import { Component, HostListener, signal } from '@angular/core';

@Component({
  selector: 'app-service-unavailable-modal',
  imports: [],
  templateUrl: './service-unavailable-modal.component.html',
})
export class ServiceUnavailableModalComponent {
  readonly open = signal(true);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.close();
  }

  close(): void {
    this.open.set(false);
  }
}
