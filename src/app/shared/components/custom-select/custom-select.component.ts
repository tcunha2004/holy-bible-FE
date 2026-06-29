import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';

export interface SelectOption {
  value: string | number;
  label: string;
}

@Component({
  selector: 'app-custom-select',
  imports: [],
  templateUrl: './custom-select.component.html',
  host: { class: 'relative block' },
})
export class CustomSelectComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly options = input.required<SelectOption[]>();
  readonly value = model<string | number | null>(null);
  readonly searchable = input(false);
  readonly placeholder = input('Selecionar');
  readonly searchPlaceholder = input('Buscar...');
  readonly ariaLabel = input('');

  private readonly searchInput =
    viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly isOpen = signal(false);
  readonly query = signal('');
  readonly activeIndex = signal(-1);

  readonly selectedLabel = computed(
    () => this.options().find((o) => o.value === this.value())?.label ?? '',
  );

  readonly filteredOptions = computed(() => {
    const term = this.normalize(this.query());
    if (!term) return this.options();
    return this.options().filter((o) => this.normalize(o.label).includes(term));
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.host.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) this.close();
  }

  toggle(): void {
    this.isOpen() ? this.close() : this.open();
  }

  open(): void {
    this.isOpen.set(true);
    this.query.set('');
    this.activeIndex.set(
      this.filteredOptions().findIndex((o) => o.value === this.value()),
    );

    queueMicrotask(() => {
      if (this.searchable()) this.searchInput()?.nativeElement.focus();
      this.scrollActiveIntoView('auto');
    });
  }

  close(): void {
    this.isOpen.set(false);
    this.activeIndex.set(-1);
  }

  select(option: SelectOption): void {
    this.value.set(option.value);
    this.close();
  }

  onSearch(term: string): void {
    this.query.set(term);
    this.activeIndex.set(this.filteredOptions().length ? 0 : -1);
  }

  onKeydown(event: KeyboardEvent): void {
    const options = this.filteredOptions();
    if (!options.length) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveActive(-1);
        break;
      case 'Enter': {
        event.preventDefault();
        const option = options[this.activeIndex()];
        if (option) this.select(option);
        break;
      }
    }
  }

  private moveActive(delta: number): void {
    const count = this.filteredOptions().length;
    const next = (this.activeIndex() + delta + count) % count;
    this.activeIndex.set(next);
    queueMicrotask(() => this.scrollActiveIntoView('smooth'));
  }

  private scrollActiveIntoView(behavior: ScrollBehavior): void {
    this.host.nativeElement
      .querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest', behavior });
  }

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim();
  }
}
