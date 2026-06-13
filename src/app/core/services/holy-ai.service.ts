import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AiMessage,
  AiSession,
  ExplainRequest,
  ExplainVerseRequest,
} from '../../shared/models/holy-ai.models';

@Injectable({ providedIn: 'root' })
export class HolyAiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/holy-ai`;

  createSession(): Observable<AiSession> {
    return this.http.post<AiSession>(`${this.apiUrl}/sessions/create`, {});
  }

  getSessions(): Observable<AiSession[]> {
    return this.http.get<AiSession[]>(`${this.apiUrl}/sessions`);
  }

  deleteSession(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sessions/${id}`);
  }

  getMessages(sessionId: string): Observable<AiMessage[]> {
    return this.http.get<AiMessage[]>(`${this.apiUrl}/sessions/${sessionId}/messages`);
  }

  explain(sessionId: string, body: ExplainRequest): Observable<AiMessage> {
    return this.http.post<AiMessage>(`${this.apiUrl}/sessions/${sessionId}/explain`, body);
  }

  explainVerse(sessionId: string, body: ExplainVerseRequest): Observable<AiMessage> {
    return this.http.post<AiMessage>(`${this.apiUrl}/sessions/${sessionId}/explain-verse`, body);
  }
}
