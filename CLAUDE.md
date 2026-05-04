# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

No test suite is configured yet.

## Architecture

**AI Site Factory** — a hub-and-spoke platform that generates 100+ vertical AI agent micro-sites. Built with Next.js 14 App Router, Supabase, and multi-provider AI routing (SiliconFlow, DeepSeek, Aliyun Bailian).

### Routing

- `/` — Main hub: agent directory with category filters. Client component (`'use client'`) that fetches from `/api/agents`.
- `/agent/[subdomain]` — Agent detail page. **Server component** that calls `getAgentBySubdomain()` then renders one of three UI templates based on `agent.category`.

### Three UI Templates (category → component mapping)

| Category | Component | Behavior |
|---|---|---|
| `vision`, `multimedia`, `marketing` | `CreativeInterface` | Image generation via `callImageGeneration()`, settings panel (ratio, style), download |
| `code`, `pro`, `business` | `AnalystInterface` | Split pane: file upload/code preview on left, embedded `ChatInterface` on right |
| Everything else | `ChatInterface` + `IndustrySidebar` | Standard chat with SSE streaming, file/image upload, suggested prompts |

### API Routes (all under `src/app/api/`)

- `POST /api/chat` — Core chat endpoint. Handles both text/image-to-text streaming and image generation. Checks user credits, deducts on success. Routes to `callAiStream` or `callImageGeneration` in `ai-router.ts`.
- `GET /api/agents` — Returns all active agents from Supabase.
- `POST /api/redeem` — Redeems a prepaid code, updates `redemption_codes` table with optimistic locking.
- `POST /api/payment/create-order` — Stub for payment integration (returns dummy order; real payment gateway not wired yet).
- `POST /api/admin/generate-codes` — Admin-only (Bearer token via `ADMIN_API_KEY`). Batch-generates redemption codes.
- `POST /api/agent/industry-news` — Calls AI to generate 3 industry tips for a given agent; persists result to `agents.industry_info`.
- `POST /api/sync-energy` — Syncs localStorage energy balance to Supabase after login.

### AI Routing (`src/lib/ai-router.ts`)

Two exported functions:
- `callAiStream(provider, modelId, messages, systemPrompt)` — Returns a streaming `Response` from the provider's `/chat/completions` endpoint.
- `callImageGeneration(provider, modelId, prompt, options)` — Always routes to SiliconFlow's `/images/generations`. Auto-falls back unsupported models (FLUX, Qwen2-VL) to `Kwai-Kolors/Kolors`.

Providers: `siliconflow`, `aliyun` (DashScope), `deepseek`. Each requires a corresponding `*_API_KEY` env var.

### Supabase Clients (`src/lib/supabase/`)

Three client factories:
- `client.ts` — Browser client (`createBrowserClient`), for client components.
- `server.ts` — Server client (`createServerClient` + cookie handling), for server components and API routes needing auth.
- `admin.ts` — Service-role client (`createClient` with `SUPABASE_SERVICE_ROLE_KEY`), bypasses RLS. Used for DB writes (credit deduction, code redemption, profile updates).

### Energy/Credit System (`src/lib/useEnergy.ts`)

React hook managing a hybrid credit model:
- **Anonymous users**: credits stored in `localStorage` under key `ai_site_energy` (defaults to 5). Deductions are local-only.
- **Logged-in users**: credits read from `profiles.energy_balance` in Supabase, with realtime subscriptions for live updates. Deductions write through to Supabase.
- On login, `GlobalHeader` calls `/api/sync-energy` to merge local credits into the cloud balance.

### Database (Supabase)

Key tables: `agents`, `prompts`, `profiles`, `usage_logs`, `redemption_codes`.  
RLS enabled; `profiles` uses `auth.uid()` scoping; `agents`/`prompts` are public-read.  
`deduct_user_credits` is a `SECURITY DEFINER` RPC function for atomic credit deduction.  
Migrations are in `supabase/migrations/`.

### Required Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SILICONFLOW_API_KEY=
DEEPSEEK_API_KEY=
ALIYUN_BAILIAN_KEY=
ADMIN_API_KEY=            # for /api/admin/generate-codes
```
