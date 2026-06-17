import { Component, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { GuideService } from '../../core/services/guide.service';

interface OnboardingOption {
  value: string;
  label: string;
}

interface OnboardingQuestion {
  key: string;
  title: string;
  subtitle: string;
  options: OnboardingOption[];
}

@Component({
  selector: 'app-onboarding',
  imports: [NgClass],
  templateUrl: './onboarding.component.html',
})
export class OnboardingComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly guide = inject(GuideService);

  readonly userName = this.firstName(this.authService.getUserName());

  readonly questions: OnboardingQuestion[] = [
    {
      key: 'readingFrequency',
      title: 'Com que frequência você lê a Bíblia?',
      subtitle: 'Não há resposta certa — queremos caminhar no seu ritmo.',
      options: [
        { value: 'rarely', label: 'De vez em quando' },
        { value: 'weekly', label: 'Algumas vezes por semana' },
        { value: 'daily', label: 'Todos os dias' },
      ],
    },
    {
      key: 'comprehensionDifficulty',
      title: 'Você sente dificuldade para compreender o que lê?',
      subtitle: 'O Holy está aqui justamente para ajudar nesses momentos.',
      options: [
        { value: 'often', label: 'Quase sempre' },
        { value: 'sometimes', label: 'Às vezes' },
        { value: 'rarely', label: 'Raramente' },
      ],
    },
    {
      key: 'aiUsage',
      title: 'Com que frequência você usa IA no dia a dia?',
      subtitle: 'Queremos entender o seu nível de familiaridade.',
      options: [
        { value: 'never', label: 'Nunca usei' },
        { value: 'sometimes', label: 'De vez em quando' },
        { value: 'daily', label: 'Todos os dias' },
      ],
    },
  ];

  readonly step = signal(0);
  readonly answers = signal<Record<string, string>>({});

  readonly totalSteps = this.questions.length + 2;
  readonly lastStep = this.totalSteps - 1;

  readonly currentQuestion = computed<OnboardingQuestion | null>(() => {
    const index = this.step() - 1;
    return index >= 0 && index < this.questions.length ? this.questions[index] : null;
  });

  readonly selectedValue = computed(() => {
    const question = this.currentQuestion();
    return question ? (this.answers()[question.key] ?? null) : null;
  });

  readonly progress = computed(() => Math.round((this.step() / this.lastStep) * 100));

  isSelected(value: string): boolean {
    return this.selectedValue() === value;
  }

  select(value: string): void {
    const question = this.currentQuestion();
    if (!question) return;

    this.answers.update((current) => ({ ...current, [question.key]: value }));
  }

  next(): void {
    if (this.step() < this.lastStep) {
      this.step.update((value) => value + 1);
    }
  }

  back(): void {
    if (this.step() > 0) {
      this.step.update((value) => value - 1);
    }
  }

  finish(): void {
    this.authService.finishOnboarding();
    this.router.navigate(['/bible']).then(() => this.guide.show());
  }

  private firstName(name: string | null): string {
    return name?.trim().split(/\s+/)[0] ?? '';
  }
}
