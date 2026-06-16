export interface Book {
  name: string;
  abbrev: string;
  chaptersCount: number;
}

export interface Verse {
  number: number;
  text: string;
}

export interface Chapter {
  number: number;
  book: Book;
  verses: Verse[];
}
