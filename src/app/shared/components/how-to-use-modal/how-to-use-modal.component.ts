import { Component, HostListener, inject } from '@angular/core';
import { GuideService } from '../../../core/services/guide.service';

interface GuideStep {
  icon: 'select' | 'ask' | 'highlight' | 'copy' | 'chat' | 'navigate';
  title: string;
  description: string;
}

@Component({
  selector: 'app-how-to-use-modal',
  imports: [],
  templateUrl: './how-to-use-modal.component.html',
})
export class HowToUseModalComponent {
  private readonly guide = inject(GuideService);

  readonly open = this.guide.open;

  readonly steps: GuideStep[] = [
    {
      icon: 'select',
      title: 'Selecione um versículo',
      description:
        'Toque em qualquer versículo para selecioná-lo. Toque em outros para montar um trecho com vários versículos de uma vez.',
    },
    {
      icon: 'ask',
      title: 'Pergunte ao Holy',
      description:
        'Com versículos selecionados, toque em “Perguntar ao Holy” para abrir o chat já com a passagem preenchida e receber uma explicação.',
    },
    {
      icon: 'highlight',
      title: 'Grife o que importa',
      description:
        'Destaque versículos marcantes. Os grifos ficam salvos e reaparecem sempre que você voltar ao capítulo.',
    },
    {
      icon: 'copy',
      title: 'Copie a passagem',
      description:
        'Copie o texto dos versículos selecionados com um toque para compartilhar onde quiser.',
    },
    {
      icon: 'chat',
      title: 'Converse livremente',
      description:
        'Use o botão flutuante do Holy para abrir o chat a qualquer momento. Suas conversas ficam salvas no histórico.',
    },
    {
      icon: 'navigate',
      title: 'Navegue pela Bíblia',
      description:
        'Escolha o livro e o capítulo no topo da tela, ou use as setas para avançar e voltar entre os capítulos.',
    },
  ];

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.close();
  }

  close(): void {
    this.guide.hide();
  }
}
