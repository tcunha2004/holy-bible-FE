import { Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { BibleService } from '../../core/services/bible.service';
import { AuthService } from '../../core/services/auth.service';
import { AiSidebarComponent } from '../holy-ai/components/ai-sidebar/ai-sidebar.component';
import {
  CustomSelectComponent,
  SelectOption,
} from '../../shared/components/custom-select/custom-select.component';
import { Book, Chapter } from '../../shared/models/bible.models';

@Component({
  selector: 'app-bible-reader',
  imports: [AiSidebarComponent, CustomSelectComponent],
  templateUrl: './bible-reader.component.html',
})
export class BibleReaderComponent implements OnInit {
  private readonly bibleService = inject(BibleService);
  private readonly authService = inject(AuthService);

  books = signal<Book[]>([]);
  selectedBookAbbrev = signal('');
  selectedChapterNumber = signal(1);
  chapter = signal<Chapter | null>(null);
  loading = signal(false);
  showSidebar = signal(false);

  selectedVerseNumbers = signal<number[]>([]);
  highlightedVerseNumbers = signal<number[]>([]);
  copied = signal(false);

  private readonly sidebar = viewChild(AiSidebarComponent);

  selectedBook = computed(
    () => this.books().find((b) => b.abbrev === this.selectedBookAbbrev()) ?? null,
  );

  selectedSet = computed(() => new Set(this.selectedVerseNumbers()));

  highlightedSet = computed(() => new Set(this.highlightedVerseNumbers()));

  allSelectedHighlighted = computed(() => {
    const highlighted = this.highlightedSet();
    const selected = this.selectedVerseNumbers();
    return selected.length > 0 && selected.every((n) => highlighted.has(n));
  });

  selectedVerses = computed(() => {
    const set = this.selectedSet();
    return (this.chapter()?.verses ?? []).filter((v) => set.has(v.number));
  });

  selectionReference = computed(() => {
    const chapter = this.chapter();
    const numbers = [...this.selectedVerseNumbers()].sort((a, b) => a - b);
    if (!chapter || !numbers.length) return '';
    return `${chapter.book.abbrev} ${chapter.number}:${this.compressRanges(numbers)}`;
  });

  chapterNumbers = computed(() => {
    const count = this.selectedBook()?.chaptersCount ?? 0;
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  bookOptions = computed<SelectOption[]>(() =>
    this.books().map((b) => ({ value: b.abbrev, label: b.name })),
  );

  chapterOptions = computed<SelectOption[]>(() =>
    this.chapterNumbers().map((n) => ({ value: n, label: `Capítulo ${n}` })),
  );

  private readonly READING_KEY = 'holy_bible_last_reading';

  ngOnInit(): void {
    this.bibleService.getBooks().subscribe((books) => {
      this.books.set(books);
      if (!books.length) return;

      const saved = this.loadReadingPosition();
      const book = saved && books.find((b) => b.abbrev === saved.abbrev);

      if (book && saved!.chapter >= 1 && saved!.chapter <= book.chaptersCount) {
        this.selectedBookAbbrev.set(saved!.abbrev);
        this.selectedChapterNumber.set(saved!.chapter);
      } else {
        this.selectedBookAbbrev.set(books[0].abbrev);
      }
      this.loadChapter();
    });
  }

  private storageKey(): string {
    const userId = this.authService.getUserId() ?? 'anon';
    return `${this.READING_KEY}:${userId}`;
  }

  private saveReadingPosition(abbrev: string, chapter: number): void {
    localStorage.setItem(this.storageKey(), JSON.stringify({ abbrev, chapter }));
  }

  private loadReadingPosition(): { abbrev: string; chapter: number } | null {
    const raw = localStorage.getItem(this.storageKey());
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  onBookChange(abbrev: string | number | null): void {
    this.selectedBookAbbrev.set(String(abbrev));
    this.selectedChapterNumber.set(1);
    this.loadChapter();
  }

  onChapterChange(num: string | number | null): void {
    this.selectedChapterNumber.set(Number(num));
    this.loadChapter();
  }

  prevChapter(): void {
    const book = this.selectedBook();
    if (!book) return;

    if (this.selectedChapterNumber() > 1) {
      this.selectedChapterNumber.update((n) => n - 1);
    } else {
      const prev = this.bookAtOffset(book, -1);
      if (!prev) return;
      this.selectedBookAbbrev.set(prev.abbrev);
      this.selectedChapterNumber.set(prev.chaptersCount);
    }
    this.loadChapter();
  }

  nextChapter(): void {
    const book = this.selectedBook();
    if (!book) return;

    if (this.selectedChapterNumber() < book.chaptersCount) {
      this.selectedChapterNumber.update((n) => n + 1);
    } else {
      const next = this.bookAtOffset(book, 1);
      if (!next) return;
      this.selectedBookAbbrev.set(next.abbrev);
      this.selectedChapterNumber.set(1);
    }
    this.loadChapter();
  }

  private bookAtOffset(current: Book, offset: number): Book | null {
    const books = this.books();
    if (!books.length) return null;
    const index = books.findIndex((b) => b.abbrev === current.abbrev);
    if (index === -1) return null;
    return books[(index + offset + books.length) % books.length];
  }

  logout(): void {
    this.authService.logout();
  }

  toggleVerse(num: number): void {
    this.selectedVerseNumbers.update((list) =>
      list.includes(num) ? list.filter((n) => n !== num) : [...list, num],
    );
  }

  clearSelection(): void {
    this.selectedVerseNumbers.set([]);
    this.copied.set(false);
  }

  copySelection(): void {
    const text = this.selectedVerses()
      .map((v) => v.text)
      .join(' ');
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  toggleHighlight(): void {
    const chapter = this.chapter();
    const verseNumbers = this.selectedVerseNumbers();
    if (!chapter || !verseNumbers.length) return;

    const remove = this.allSelectedHighlighted();
    const payload = {
      abbrev: chapter.book.abbrev,
      chapterNumber: chapter.number,
      verseNumbers,
    };
    const request = remove
      ? this.bibleService.unhighlightVerses(payload)
      : this.bibleService.highlightVerses(payload);

    request.subscribe(() => {
      this.highlightedVerseNumbers.update((list) =>
        remove
          ? list.filter((n) => !verseNumbers.includes(n))
          : [...new Set([...list, ...verseNumbers])],
      );
      this.clearSelection();
    });
  }

  askHoly(): void {
    const chapter = this.chapter();
    const selected = this.selectedVerses();
    if (!chapter || !selected.length) return;
    const text = selected
      .map((v) => `${chapter.book.name} ${chapter.number}:${v.number} — ${v.text}`)
      .join('\n');
    this.sidebar()?.prefill(text);
    this.clearSelection();
  }

  private compressRanges(numbers: number[]): string {
    const ranges: string[] = [];
    let start = numbers[0];
    let prev = numbers[0];

    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] === prev + 1) {
        prev = numbers[i];
        continue;
      }
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = prev = numbers[i];
    }
    ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
    return ranges.join(', ');
  }

  private loadChapter(): void {
    const book = this.selectedBook();
    if (!book) return;
    this.loading.set(true);
    this.clearSelection();
    this.chapter.set(null);
    this.bibleService.getChapter(book.abbrev, this.selectedChapterNumber()).subscribe({
      next: (chapter) => {
        this.chapter.set(chapter);
        this.highlightedVerseNumbers.set(
          chapter.verses.filter((v) => v.highlighted).map((v) => v.number),
        );
        this.saveReadingPosition(chapter.book.abbrev, chapter.number);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
