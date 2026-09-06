# Personal Gemini Journal

A secure journaling web app built for the **Accelerate AI with Cloud Run** challenge. Users sign in, have multi-turn brainstorming/journaling conversations with the Gemini API, and get AI-powered insight into their own journal — with zero cross-user data leakage and no hardcoded secrets anywhere in the codebase.

## Core Requirements

| Requirement | Implementation |
|---|---|
| **User Authentication** | Firebase Authentication (email/password + Google sign-in) on the frontend. Every backend route is protected by `authMiddleware`, which verifies the Firebase ID token server-side before any request touches user data. |
| **Multi-turn AI Interaction** | `/api/chat` proxies conversation history to the Gemini API (`gemini-2.0-flash`) via `services/gemini.js`, with a system instruction that explicitly frames journal text as *data, not instructions* — basic prompt-injection hygiene. |
| **Isolated Data Storage** | Entries live at `/users/{uid}/entries/{entryId}` in Cloud Firestore. `firestore.rules` **default-denies all access** and only grants read/write via an `isOwner(userId)` check against `request.auth.uid` — never a client-supplied ID — so a modified client cannot read another user's entries. |
| **Secure Key Management** | `services/secretManager.js` fetches the Gemini API key from **Google Cloud Secret Manager** at runtime, caches it in memory, and fails closed (503) if retrieval fails. The key is never present in frontend code or committed config. |

## Enhancements Beyond the Base Spec

1. **Mood & Topic Trends** — `POST /api/entries/:id/analyze` asks Gemini to extract a mood label and topic tags for a saved entry; `GET /api/trends` aggregates these (scoped to the caller's own entries only) to power a Recharts-based dashboard showing mood over time and recurring topics.
2. **AI-Generated Daily Prompt** — `GET /api/prompts/today` generates a personalized journaling prompt from the user's last 5 entries, then caches it per user, per day, in `/users/{uid}/dailyPrompts/{date}` to avoid redundant Gemini calls on repeated page loads.
3. **Full Journal Export** — `GET /api/export` returns all of a user's entries (text, summaries, mood, tags) as a time-ordered JSON archive, built entirely from the authenticated user's own Firestore path.

## Architecture

```
frontend/   React (Vite) — Firebase sign-in UI, journal chat, trends view. Never calls Gemini directly.
backend/    Express on Cloud Run
  ├─ middleware/auth.js       verifies Firebase ID token on every /api request
  ├─ services/secretManager.js  retrieves Gemini key from Secret Manager (fail-closed)
  ├─ services/gemini.js       Gemini client + chat/content helpers, injection-safe system prompt
  └─ routes/                  chat, entries, trends, prompts, export
firestore.rules  default-deny, per-uid isolation, schema validation on writes
firebase.json    hosting + firestore rules deployment config
```

## Local Development

```bash
# Backend
cd backend
cp .env.example .env   # fill in GCP_PROJECT_ID; optionally set GEMINI_API_KEY for local-only dev
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

In production, the backend retrieves the Gemini key exclusively from Secret Manager — the `.env` override is local-dev only and is never used when deployed.

## Deployment

- **Frontend**: `npm run build` in `frontend/`, deployed via Firebase Hosting (see `firebase.json`).
- **Backend**: Deployed to Cloud Run; grant its service account `roles/secretmanager.secretAccessor` on the `gemini-api-key` secret.
- **Firestore rules**: `firebase deploy --only firestore:rules`.

## Security Notes

- All authorization is enforced server-side against the Firebase-verified `uid` — never a client-supplied parameter.
- Firestore rules deny by default; every allow rule is scoped to `isOwner(userId)`.
- The Gemini API key never reaches the browser and is not hardcoded anywhere in source control.
