# Tranquiloo Deployment Guide

## Architecture Overview

- **Development**: `server/index.ts` - Full-featured dev server with Vite HMR, WebSockets, background jobs
- **Production**: `server/prod.ts` - Serverless-compatible build for Vercel deployment

## Production Limitations (Vercel Serverless)

### ✅ What Works in Production
- All API routes (authentication, therapist features, chat sessions)
- PostgreSQL database (Supabase)
- SendGrid email sending
- Static file serving (React app)
- AI features (OpenAI, Azure Speech)

### ❌ What Only Works in Development
1. **Video Calls** (`server/routes/video-call.ts`)
   - Uses WebSockets which require persistent connections
   - Vercel serverless functions are stateless and can't maintain WebSocket connections
   - **Alternative**: Use a third-party service like Twilio, Agora, or deploy video server separately

2. **Background Email Queue** (`emailService.startEmailProcessor()`)
   - Background jobs don't persist in serverless
   - **Alternative**: Use Vercel Cron Jobs for scheduled tasks

3. **SQLite Database**
   - No persistent filesystem in serverless
   - **Solution**: Use PostgreSQL (Supabase) - already implemented ✅

## Build Configuration

### Key Files
- `server/prod.ts` - Production entry point
- `server/index.ts` - Development entry point (NOT deployed)
- `package.json` build script uses `--packages=external` to avoid bundling Node.js packages

### Removed Legacy Code
- ~~`server/routes/chat.ts`~~ - SQLite-based route (deleted - incompatible with serverless)

## Environment Variables Required

Production requires these env vars in Vercel:
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_DB_PASSWORD` - Supabase database password
- `SENDGRID_API_KEY` - Email service (optional, will log to console if missing)
- `OPENAI_API_KEY` - AI features
- `AZURE_SPEECH_KEY` - Speech-to-text
- `AZURE_SPEECH_REGION` - Azure region

## Deployment Process

1. Push to `main` branch
2. Vercel auto-detects push
3. Runs `npm run build` (defined in vercel.json)
4. Builds client with Vite → `dist/public/`
5. Builds server with esbuild → `dist/prod.js`
6. Deploys to serverless functions

## Troubleshooting

### "Dynamic require of X is not supported"
- Package is being bundled instead of marked as external
- Solution: Already fixed with `--packages=external` flag

### 401 errors on static files
- Middleware order issue - static files must be served before auth routes
- Solution: Already fixed - `express.static()` is first middleware

### Routes not registered
- Async timing issue - routes registered after app exported
- Solution: Already fixed - using `await createApp()` pattern
