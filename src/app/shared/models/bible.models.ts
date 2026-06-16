export interface Book {
  name: string;
  abbrev: string;
  chaptersCount: number;
}

export interface Verse {
  number: number;
  text: string;
  highlighted?: boolean;
}

export interface HighlightRequest {
  abbrev: string;
  chapterNumber: number;
  verseNumbers: number[];
}

export interface Chapter {
  number: number;
  book: Book;
  verses: Verse[];
}
