# Cadence

Daily social posts, written and designed for you. Every day at your chosen time (default **5:00 PM** in your timezone) Cadence:

1. Reads that day's slot from your weekly content calendar (pillar, brief, carousel / single image / rest day).
2. Writes the post with OpenAI: slide copy, a LinkedIn caption and an Instagram caption, each with SEO keywords and hashtags.
3. Renders on-brand 1080×1350 slides (your colours, logo, font and handle), plus a PDF of carousels for LinkedIn.
4. Emails it all to you via Resend: slides attached, captions ready to paste, and a link to a mobile-friendly post page with one-tap copy, downloads and **Regenerate**.

You then post it to LinkedIn and Instagram yourself.

```
pg_cron (every 15 min) ──► scheduler ──► generate ──► OpenAI (copy)
                                            │
                                            ├──► render-slide ×N (Satori → resvg → JPEG) ──► Storage
                                            ├──► PDF (LinkedIn carousel) ──► Storage
                                            └──► Resend email (slides + PDF attached) ──► you
```

## What's in here

| Path | What it is |
| --- | --- |
| `supabase/migrations/` | Tables, row-level security, storage buckets, and the cron job |
| `supabase/functions/scheduler` | Called by pg_cron; starts today's post when your local time passes the schedule |
| `supabase/functions/generate` | Writes the post, fans out slide rendering, builds the PDF, emails you |
| `supabase/functions/render-slide` | Renders one slide to JPEG (one call per slide keeps each under the CPU limit) |
| `supabase/functions/review` | Post page data, regenerate with feedback, resend the email |
| `supabase/functions/_shared/slide-templates.ts` | Slide designs, shared with the web app's live preview |
| `web/` | Next.js 16 app: landing page, onboarding, dashboard, public post page |

The backend is all Supabase: Postgres, Auth, Storage, Edge Functions, pg_cron, pg_net and Vault.

## Go-live checklist

You'll need a Supabase project, an OpenAI API key and a Resend account. Run commands from the repo root unless noted.

### 1. Supabase database

```bash
npx supabase login
```

```bash
npx supabase link --project-ref <project-ref>
```

```bash
npx supabase db push
```

This creates the tables, policies, the `post-media` and `brand-assets` buckets, and the `cadence-scheduler` cron job.

### 2. Web app

```bash
cd web && cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase → Project Settings → API). To deploy on Vercel, import the repo with **Root Directory** set to `web` and add the same two environment variables. Note the deployed URL.

### 3. Edge Function secrets

```bash
cp supabase/functions/.env.example supabase/functions/.env
```

Fill it in: `CADENCE_INTERNAL_SECRET` (generate with `openssl rand -hex 32`), `SITE_URL` (your deployed web app), the OpenAI key and the Resend key/sender. Then:

```bash
npx supabase secrets set --env-file supabase/functions/.env
```

```bash
npx supabase functions deploy
```

### 4. Turn on the 5 PM job

In the Supabase SQL editor, store the two values the cron job reads. Use the **same** secret as `CADENCE_INTERNAL_SECRET`:

```sql
select vault.create_secret('https://<project-ref>.supabase.co', 'cadence_project_url');
select vault.create_secret('<your CADENCE_INTERNAL_SECRET>', 'cadence_internal_secret');
```

The job runs every 15 minutes and is cheap: the scheduler only does work when a workspace's local time has just passed its generation time and today's post doesn't exist yet. If Supabase was down at 5 PM, it catches up for up to 3 hours. You can see the runs under **Integrations → Cron** in the dashboard.

### 5. Auth

In **Authentication → URL Configuration**, set the Site URL to your web app and add `https://<your-app>/auth/callback` to the redirect URLs. After creating your account, turn off **Allow new users to sign up** (**Authentication → Sign In / Providers**) so only you can use it.

### 6. Resend

Verify your sending domain in Resend and set `EMAIL_FROM` to an address on it, e.g. `Cadence <cadence@syncv.app>`. Before the domain is verified, `onboarding@resend.dev` works but only delivers to the address you signed up to Resend with.

### 7. First run

Sign in and complete onboarding. **Fill in SynCV** and **Load SynCV calendar** fill in your brand and weekly plan. Then press **Generate a post now** on the dashboard; about a minute later the email arrives.

## Posting what you receive

- **Instagram:** save the attached slides (or use the post page on your phone) and post them as a carousel in order. Paste the Instagram caption.
- **LinkedIn:** create a post, add the attached PDF as a document (it shows as a swipeable carousel), and paste the LinkedIn caption. Single-image days just use the image.
- **Regenerate:** if a post isn't right, click Regenerate in the email or on the post page and say what to change. A new version arrives about a minute later.
- Links in the email work for 30 days. Only a SHA-256 hash of each link's token is stored.

## Customising

- **Slide design:** edit `supabase/functions/_shared/slide-templates.ts`, then run `npm run sync:shared` in `web/` so the live preview matches (this also runs automatically before `dev` and `build`). Redeploy the functions.
- **Writing style and rules:** the prompt lives in `supabase/functions/_shared/openai.ts`.
- **Model:** set `OPENAI_MODEL`, or choose one per workspace in **Settings → Generation**.

## Notes

- Slide text is rendered from templates, not by an image model, so it's always crisp and on-brand. Emoji are kept out of the slides; captions can use them.
- A slide takes about 0.3 s to render (measured locally). Each slide is rendered in its own function call to stay well under the Edge Functions CPU limit.
- Carousels are capped at 10 slides (Instagram's limit).
- Slide images live in the public `post-media` bucket so email clients can display them. File paths contain random IDs.
