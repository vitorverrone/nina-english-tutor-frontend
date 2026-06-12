# English Tutor — Frontend

Next.js frontend for an AI-powered English tutor app. The backend API is hosted separately.

## Features

- CEFR placement test on signup
- Chat with AI tutor **Nina** — grammar lessons and situational roleplay (airport, restaurant, job interview)
- SM-2 spaced-repetition review deck fed by per-turn error/vocab extraction
- IELTS-style writing rubric with score breakdown and revised native version
- CEFR level-up promotion exam (async generation flow)
- Job interview practice with structured debrief
- Dictogloss daily listening exercise
- Multi-language coaching: `pt`, `en`, `es`
- Immersion mode (EN-only coaching for B1+ learners)
- Web Speech API mic input + TTS playback

## Tech stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **i18n**: next-intl (`/pt/...`, `/en/...`, `/es/...`)
- **Markdown**: react-markdown
- **Auth**: JWT cookie (issued by backend)

## Getting started

```bash
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL to point at the backend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | yes | Backend API base URL |
| `INTERNAL_API_URL` | no | Server-side API URL (falls back to `NEXT_PUBLIC_API_URL`) |

## Project structure

```
apps/web/
├── app/[locale]/
│   ├── (app)/          Authenticated pages (home, chat, review, writing, ...)
│   └── (auth)/         Public pages (login, signup, onboarding, verify-email)
├── components/         Client components (ChatUI, ReviewDeck, MicButton, ...)
├── lib/                API client, server actions, i18n helpers
└── messages/           Translation catalogs (pt.json, en.json, es.json)
packages/shared/        TypeScript types shared with the backend
```
