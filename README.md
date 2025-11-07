# next-ai-base

Minimal, production-ready scaffold for an AI-focused chat application built with Next.js 15 App Router and a modern TypeScript toolchain.

## Tech Stack
- **Next.js 15 + App Router** – server components, file-based routing, API routes.
- **TypeScript** – strict typing across app, lib, and store code.
- **TailwindCSS 4** – utility-first styling ready to extend (no custom UI yet).
- **TanStack Query** – async data caching with a shared `QueryClient` provider.
- **Zustand** – lightweight client-side UI state.
- **Zod** – schema validation for future API payloads.
- **Supabase** – auth-ready browser/server helpers via `@supabase/ssr`.
- **Stripe SDK** – server-side billing client (lazy-instantiated).
- **OpenAI SDK** – server-side client instance, ready for AI chat flows.
- **Bun** – fast dependency installer (`bun i`). Development scripts still run with `npm`.

## Folder Structure
- `app/` – App Router pages and API routes. Includes placeholder routes for `/`, `/dashboard`, `/chat`, `/billing`, plus `/api/health`.
- `components/` – placeholder folder for shared UI components (empty `.gitkeep`).
- `providers/` – client-side React context/providers (currently the TanStack Query provider).
- `store/` – Zustand stores (`useUiStore` exposes a basic `isOpen` boolean).
- `lib/` – service clients and shared utilities:
  - `supabase.ts` – browser + server helpers with SSR-ready cookies integration.
  - `stripe.ts` – Stripe server client (null until `STRIPE_SECRET_KEY` is set).
  - `openai.ts` – OpenAI client instance (null until `OPENAI_API_KEY` exists).
  - `zod-schemas.ts` – example chat message schema + inferred type.
- `.env.example` – environment variable template.

## Architecture Overview
```
┌────────────────────────────────────────────────────────────────────┐
│ Client (App Router pages)                                          │
│ ┌────────────┬────────────┬────────────┬────────────┐              │
│ │   /        │ /dashboard │   /chat    │  /billing  │ <-- RSC/SSR │
│ └────────────┴────────────┴────────────┴────────────┘              │
│          │                │                │                      │
│          ▼                ▼                ▼                      │
│   QueryProvider (TanStack Query) + Zustand stores (`store/`)       │
│          │                                                       │
├──────────┴───────────────────────────────────────────────────────┤
│ Server Components / API Routes (`app/api/*`)                      │
│   • `/api/health` – liveness probe                                │
│   • Future routes consume shared libs                             │
├──────────┬───────────────────────────────────────────────────────┤
│ Shared Services (`lib/`)                                          │
│   • `supabase.ts` – browser + server clients w/ cookies           │
│   • `stripe.ts` – server-only Stripe SDK                          │
│   • `openai.ts` – OpenAI SDK instance                             │
│   • `zod-schemas.ts` – validation layer                           │
└──────────┴───────────────────────────────────────────────────────┘
            │
            ▼
 External Providers (Supabase Auth, Stripe Billing, OpenAI API)
```

## Local Development
1. **Install dependencies**
   ```bash
   bun i
   ```
   (or `npm install` if you prefer Node’s package manager.)
2. **Environment variables**
   ```bash
   cp .env.example .env.local
   # Fill in Supabase, Stripe, and OpenAI keys before using those SDKs.
   ```
3. **Run the dev server**
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000` to browse the placeholder pages.

## Health Check Endpoint
Verify the API surface is live:
```bash
curl http://localhost:3000/api/health
# => { "status": "ok" }
```

## Future Expansion Points
1. **AI Chat Flows** – hook `/chat` into OpenAI responses, stream completions, and persist message history via Supabase.
2. **Authentication** – wire Supabase Auth in `app/(auth)` routes, secure the dashboard, and hydrate Zustand with session info.
3. **Billing** – connect Stripe pricing, webhooks, and a full `/billing` management UI.
4. **Data Fetching** – define TanStack Query hooks for chats, usage metrics, and billing status with Zod validation per request.
5. **UI System** – build shared components (buttons, layouts) inside `components/` and integrate Tailwind tokens/themes when ready.
