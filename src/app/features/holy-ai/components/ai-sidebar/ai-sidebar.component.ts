import {
  Component,
  ElementRef,
  inject,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HolyAiService } from '../../../../core/services/holy-ai.service';
import { AiSession } from '../../../../shared/models/holy-ai.models';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
}

@Component({
  selector: 'app-ai-sidebar',
  imports: [],
  templateUrl: './ai-sidebar.component.html',
})
export class AiSidebarComponent {
  private readonly holyAi = inject(HolyAiService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly open = model(false);

  private readonly scrollArea =
    viewChild<ElementRef<HTMLElement>>('scrollArea');
  private readonly composer =
    viewChild<ElementRef<HTMLTextAreaElement>>('composer');

  readonly sessions = signal<AiSession[]>([]);
  readonly activeSessionId = signal<string | null>(null);
  readonly messages = signal<ChatMessage[]>([]);
  readonly input = signal('');
  readonly sending = signal(false);
  readonly loadingSessions = signal(false);
  readonly loadingMessages = signal(false);
  readonly showSessions = signal(false);
  readonly limitReached = signal(false);
  readonly limitMessage = signal('');

  readonly swipedId = signal<string | null>(null);
  readonly activeSwipeId = signal<string | null>(null);
  readonly swipeOffset = signal(0);
  private swipeStartX = 0;
  private swipeStartY = 0;
  private swiping = false;
  private justSwiped = false;
  private readonly deleteWidth = 64;

  private sessionsLoaded = false;

  collapse(): void {
    this.open.set(false);
  }

  onToggleSessions(): void {
    const next = !this.showSessions();
    this.showSessions.set(next);
    if (next && !this.sessionsLoaded) this.loadSessions();
  }

  openSessions(): void {
    this.showSessions.set(true);
    if (!this.sessionsLoaded) this.loadSessions();
  }

  newSession(): void {
    this.activeSessionId.set(null);
    this.messages.set([]);
    this.input.set('');
    this.showSessions.set(false);
  }

  onSessionClick(session: AiSession): void {
    if (this.justSwiped) {
      this.justSwiped = false;
      return;
    }
    if (this.swipedId() === session.id) {
      this.swipedId.set(null);
      return;
    }
    this.selectSession(session);
  }

  selectSession(session: AiSession): void {
    this.swipedId.set(null);
    this.showSessions.set(false);
    if (session.id === this.activeSessionId()) return;

    this.activeSessionId.set(session.id);
    this.messages.set([]);
    this.loadingMessages.set(true);
    this.holyAi.getMessages(session.id).subscribe({
      next: (msgs) => {
        this.messages.set(
          msgs.map((m) => ({ role: m.role, content: m.content })),
        );
        this.loadingMessages.set(false);
        this.scrollToBottom();
      },
      error: () => this.loadingMessages.set(false),
    });
  }

  deleteSession(session: AiSession, event: Event): void {
    event.stopPropagation();
    this.swipedId.set(null);
    this.holyAi.deleteSession(session.id).subscribe(() => {
      this.sessions.update((list) => list.filter((s) => s.id !== session.id));
      if (this.activeSessionId() === session.id) this.newSession();
    });
  }

  rowTransform(id: string): string {
    if (this.activeSwipeId() === id) {
      return `translateX(${this.swipeOffset()}px)`;
    }
    return this.swipedId() === id
      ? `translateX(-${this.deleteWidth}px)`
      : 'translateX(0)';
  }

  onSwipeStart(id: string, event: TouchEvent): void {
    this.swipeStartX = event.touches[0].clientX;
    this.swipeStartY = event.touches[0].clientY;
    this.activeSwipeId.set(id);
    this.swipeOffset.set(this.swipedId() === id ? -this.deleteWidth : 0);
    this.swiping = false;
    this.justSwiped = false;
    if (this.swipedId() && this.swipedId() !== id) this.swipedId.set(null);
  }

  onSwipeMove(id: string, event: TouchEvent): void {
    if (this.activeSwipeId() !== id) return;
    const dx = event.touches[0].clientX - this.swipeStartX;
    const dy = event.touches[0].clientY - this.swipeStartY;
    if (!this.swiping && Math.abs(dy) > Math.abs(dx)) {
      this.activeSwipeId.set(null);
      return;
    }
    if (Math.abs(dx) > 6) this.swiping = true;
    const base = this.swipedId() === id ? -this.deleteWidth : 0;
    const offset = Math.min(0, Math.max(-this.deleteWidth, base + dx));
    this.swipeOffset.set(offset);
  }

  onSwipeEnd(id: string): void {
    if (this.activeSwipeId() !== id) return;
    const opened = this.swipeOffset() <= -this.deleteWidth / 2;
    this.justSwiped = this.swiping;
    this.swipedId.set(opened ? id : null);
    this.activeSwipeId.set(null);
    this.swiping = false;
  }

  send(): void {
    const text = this.input().trim();
    if (!text || this.sending() || this.limitReached()) return;

    this.input.set('');
    this.resetComposerHeight();
    this.messages.update((m) => [...m, { role: 'user', content: text }]);
    this.sending.set(true);
    this.scrollToBottom();

    const sessionId = this.activeSessionId();
    if (sessionId) {
      this.requestExplanation(sessionId, text, false);
      return;
    }

    this.holyAi.createSession().subscribe({
      next: (session) => {
        this.activeSessionId.set(session.id);
        this.sessions.update((list) => [session, ...list]);
        this.requestExplanation(session.id, text, true);
      },
      error: (err: HttpErrorResponse) => this.handleError(err),
    });
  }

  prefill(text: string): void {
    if (!text) return;
    this.open.set(true);
    this.showSessions.set(false);
    const current = this.input().trim();
    this.input.set(current ? `${current}\n${text}` : text);
    requestAnimationFrame(() => {
      const el = this.composer()?.nativeElement;
      if (!el) return;
      this.autoResize(el);
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  }

  onInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    this.input.set(el.value);
    this.autoResize(el);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  format(content: string): SafeHtml {
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const html = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private requestExplanation(
    sessionId: string,
    message: string,
    isNew: boolean,
  ): void {
    this.holyAi.explain(sessionId, { message }).subscribe({
      next: ({ explanation }) => {
        this.messages.update((m) => [
          ...m,
          { role: 'assistant', content: explanation },
        ]);
        this.sending.set(false);
        this.scrollToBottom();
        if (isNew) this.loadSessions();
      },
      error: (err: HttpErrorResponse) => this.handleError(err),
    });
  }

  private loadSessions(): void {
    this.sessionsLoaded = true;
    this.loadingSessions.set(true);
    this.holyAi.getSessions().subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        this.loadingSessions.set(false);
      },
      error: () => this.loadingSessions.set(false),
    });
  }

  private handleError(err: HttpErrorResponse): void {
    this.sending.set(false);

    if (err.status === 429) {
      this.limitMessage.set(
        this.extractMessage(err) ??
          'Você atingiu o limite diário de requisições.',
      );
      this.limitReached.set(true);
      this.scrollToBottom();
      return;
    }

    this.messages.update((m) => [
      ...m,
      {
        role: 'assistant',
        content: 'Não foi possível responder agora. Tente novamente em instantes.',
        error: true,
      },
    ]);
    this.scrollToBottom();
  }

  private extractMessage(err: HttpErrorResponse): string | null {
    const body = err.error;
    if (!body) return null;
    if (typeof body === 'string') return body;
    if (typeof body.message === 'string') return body.message;
    if (Array.isArray(body.message)) return body.message.join(' ');
    return null;
  }

  private scrollToBottom(): void {
    requestAnimationFrame(() => {
      const el = this.scrollArea()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  private autoResize(el: HTMLTextAreaElement): void {
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  private resetComposerHeight(): void {
    const el = this.composer()?.nativeElement;
    if (el) el.style.height = 'auto';
  }
}
