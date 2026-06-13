export interface Book {
  id: number;
  name: string;
  abbrev: string;
  testament: string;
}

export interface Verse {
  id: number;
  number: number;
  text: string;
}

export interface Chapter {
  id: number;
  number: number;
  book: Book;
  verses: Verse[];
}
