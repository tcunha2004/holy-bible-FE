import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Book,
  Chapter,
  HighlightRequest,
} from '../../shared/models/bible.models';

@Injectable({ providedIn: 'root' })
export class BibleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/bible`;

  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.apiUrl}/books`);
  }

  getChapter(abbrev: string, chapterNumber: number): Observable<Chapter> {
    return this.http.get<Chapter>(
      `${this.apiUrl}/chapter/${abbrev}/${chapterNumber}`,
    );
  }

  highlightVerses(payload: HighlightRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/highlights`, payload);
  }

  unhighlightVerses(payload: HighlightRequest): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/highlights`, {
      body: payload,
    });
  }
}
