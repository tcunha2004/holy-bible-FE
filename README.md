# Holy Bible

Aplicação web de leitura da Bíblia com um assistente de IA ("Holy AI") que explica
versículos e capítulos, além de autenticação de usuários, onboarding e marcação de
versículos favoritos.

Frontend construído com [Angular 22](https://angular.dev/) (standalone components,
roteamento com lazy-loading) e estilizado com [Tailwind CSS 4](https://tailwindcss.com/).

## Funcionalidades

- **Leitor da Bíblia** — navegação por livros e capítulos, com header de livro/capítulo
  fixo durante a rolagem.
- **Holy AI** — sidebar de chat que explica versículos selecionados e mantém sessões
  de conversa.
- **Destaque de versículos** — marcar/desmarcar versículos favoritos.
- **Autenticação** — login e cadastro, com interceptor de token e guards de rota
  (`auth`, `guest`, `onboarding`).
- **Onboarding** — fluxo de boas-vindas e modal de "como usar a plataforma".
- **Mobile-first** — layout responsivo com ajustes específicos para teclado e zoom no iOS.

## Pré-requisitos

- [Node.js](https://nodejs.org/) (versão compatível com Angular 22)
- npm 10+

## Instalação

```bash
npm install
```

## Servidor de desenvolvimento

```bash
npm start
```

A aplicação fica disponível em `http://localhost:4200/` e recarrega automaticamente a
cada alteração nos arquivos-fonte.

## Build

```bash
npm run build
```

Os artefatos de build são gerados no diretório `dist/`. O build de produção é otimizado
para performance.

## Testes

Testes unitários usam o runner [Vitest](https://vitest.dev/):

```bash
npm test
```

## Configuração de ambiente

A URL da API é definida em `src/environments/environment.ts`:

```ts
export const environment = {
  production: true,
  apiUrl: 'https://holy-bible-api-production-67ab.up.railway.app',
};
```

A API expõe os módulos `/bible` (livros, capítulos, destaques) e `/holy-ai`
(sessões e explicações de IA), consumidos por `BibleService` e `HolyAiService`.

## Estrutura do projeto

```
src/app/
├── core/                # serviços, guards e interceptors compartilhados
│   ├── guards/          # auth, guest, onboarding
│   ├── interceptors/    # auth (token)
│   └── services/        # auth, bible, guide, holy-ai
├── features/            # telas (lazy-loaded)
│   ├── auth/            # login e cadastro
│   ├── bible-reader/    # leitor da Bíblia
│   ├── holy-ai/         # sidebar de IA
│   ├── onboarding/      # fluxo de boas-vindas
│   └── welcome/         # tela inicial
├── layout/              # main-layout
├── shared/              # componentes e models reutilizáveis
├── app.config.ts        # configuração da aplicação
└── app.routes.ts        # rotas
```

## Rotas principais

| Rota          | Descrição                                    |
| ------------- | -------------------------------------------- |
| `/bible`      | Leitor da Bíblia (requer autenticação)       |
| `/auth/login` | Login (apenas visitantes)                    |
| `/auth/register` | Cadastro (apenas visitantes)              |
| `/onboarding` | Onboarding do usuário                        |
| `/welcome`    | Tela de boas-vindas                          |
