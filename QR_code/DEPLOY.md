# Vercel Deployment

## What this version does

- The frontend lives in `QR_code/`
- The browser submits questionnaire data to `POST /api/analyze-risk`
- The Vercel serverless function calls DeepSeek with your secret key
- The server can store questionnaire answers in Postgres when configured

## Required Vercel environment variables

- `DEEPSEEK_API_KEY`

## Optional Vercel environment variables

- `POSTGRES_URL`

If you create Vercel Postgres through the Vercel dashboard, `POSTGRES_URL` is normally injected automatically. If it is missing or the database is unavailable, the AI analysis still runs and the API skips persistence.

## Database table

When `POSTGRES_URL` is configured, the API will auto-create this table on first request:

- `cancer_risk_submissions`

Saved fields include:

- `questionnaire`
- `created_at`

## Suggested deploy flow

1. Import this repo into Vercel.
2. Add `DEEPSEEK_API_KEY` in the project settings.
3. Optionally create a Postgres database in Vercel Storage and connect it to the project.
4. Deploy.
5. Open `/QR_code/` on the deployed site.

## Security note

The DeepSeek API key is not used in the frontend. It is only read on the server from Vercel environment variables.

## Local test before deploy

1. Put your real DeepSeek key in `.env.local`.
2. Leave `POSTGRES_URL` empty if you want to test without a database.
3. Run `npm run test:api`.

The smoke test calls the serverless handler directly and should still pass without a database connection.
