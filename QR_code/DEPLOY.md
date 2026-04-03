# Vercel Deployment

## What this version does

- The frontend lives in `QR_code/`
- The browser submits questionnaire data to `POST /api/analyze-risk`
- The Vercel serverless function calls OpenRouter with your secret key
- The server stores questionnaire answers and AI output in Postgres

## Required Vercel environment variables

- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `OPENROUTER_SITE_URL`
- `OPENROUTER_SITE_NAME`
- `POSTGRES_URL`

If you create Vercel Postgres through the Vercel dashboard, `POSTGRES_URL` is normally injected automatically.

## Database table

The API will auto-create this table on first request:

- `cancer_risk_submissions`

Saved fields include:

- `session_id`
- `questionnaire`
- `ai_result`
- `overall_risk`
- `user_agent`
- `client_ip`
- `created_at`

## Suggested deploy flow

1. Import this repo into Vercel.
2. Create a Postgres database in Vercel Storage and connect it to the project.
3. Add the OpenRouter environment variables in the project settings.
4. Deploy.
5. Open `/QR_code/` on the deployed site.

## Security note

The OpenRouter API key is no longer used in the frontend. It is only read on the server from Vercel environment variables.
