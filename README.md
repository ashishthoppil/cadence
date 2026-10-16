# Cadence

Daily social posts, written and designed for any business. Every day at the customer's chosen time (default **5:00 PM** in their timezone) Cadence:

1. Reads that day's slot from their weekly content calendar (theme, brief, and format: carousel, single image, short video or rest day).
2. Writes the post with OpenAI in two passes (a writer, then an editor that checks sense, grammar and house style), with a caption and hashtags for each platform they use: LinkedIn, Instagram, Facebook, X and TikTok.
3. Designs it: on-brand 1080×1350 slides from one of 20 templates, using the brand's own photos, Pixabay stock photos or text only. On the Image + Videos plan, video days get an 8-second vertical video from Gemini.
4. Emails it via Resend: slides or video attached, captions ready to paste, and a link to a post page with one-tap copy, downloads and **Regenerate**.

Customers post it themselves. Billing is through Dodo Payments: **Image Only** (₹1,499 / $45 a month) and **Image + Videos** (₹2,999 / $89 a month), with 3 free posts and no card needed to start. Visitors from India see INR prices and everyone else sees USD.

```
pg_cron (every 15 min) ──► scheduler ──► generate ──► OpenAI (writer + editor)
                                            │
                                            ├─ carousel / image ─► Pixabay or your photos ─► render-slide ×N ─► Storage
                                            │                                                └► PDF for LinkedIn
                                            ├─ video ─► Gemini (background job) ◄── video-poller (every minute)
                                            └──► Resend email ──► customer

Dodo Payments ──► dodo-webhook ──► subscriptions table ──► plan limits in scheduler / generate / review
```

## What's in here

| Path | What it is |
| --- | --- |
| `supabase/migrations/` | Tables, row-level security, storage buckets and both cron jobs |
| `supabase/functions/scheduler` | Called by pg_cron. Starts each workspace's post when its local time passes the schedule |
| `supabase/functions/generate` | Writes the post, picks photos, renders slides or starts the video, emails it |
| `supabase/functions/render-slide` | Renders one slide to JPEG (one call per slide keeps each under the CPU limit) |
| `supabase/functions/video-poller` | Called every minute by pg_cron while a video is rendering. Saves and emails it when ready |
| `supabase/functions/review` | Post page data, regenerate with feedback, resend the email |
| `supabase/functions/media` | Describes uploaded photos (OpenAI vision) so each post gets a fitting one |
| `supabase/functions/billing` | Starts Dodo checkout, changes plan, opens the billing portal |
| `supabase/functions/dodo-webhook` | Receives Dodo subscription events and updates the customer's plan |
| `supabase/functions/_shared/slide-templates.ts` | The 20 slide templates, shared with the web app's live preview |
| `supabase/functions/_shared/plans.ts` | Plan names, prices and limits, shared with the web app |
| `web/` | Next.js 16 app: landing page with pricing, sign-in (email or Google), onboarding, dashboard, public post page |

The backend is all Supabase: Postgres, Auth, Storage, Edge Functions, pg_cron, pg_net and Vault.

## Upgrading an existing install

If you already ran the first version, run these from the repo root:

```bash
npx supabase db push
```

This applies `20261016000000_saas.sql` and `20261016000100_stock_photos.sql`, which:
- Adds business details, platforms, photo source and templates.
- Moves captions to one column covering every platform.
- Adds the photo library and subscriptions tables.
- Schedules the `cadence-video-poller` cron job.
- Adds the stock photo search cache.

Existing workspaces keep their content: the old slide theme becomes the template, and LinkedIn and Instagram hashtags merge into "always-on hashtags". Then:
- Add the new secrets (step 3 below).
- Set up Dodo (step 6) and Google sign-in (step 5).
- Redeploy every function with `npx supabase functions deploy`.

To keep using your own workspace without paying, give it a plan in the SQL editor:

```sql
insert into subscriptions (workspace_id, plan, status)
select id, 'video', 'active' from workspaces where approval_email = 'you@example.com';
```

## Go-live checklist

You'll need:
- A Supabase project.
- OpenAI and Gemini API keys.
- A Pixabay API key (free).
- A Resend account.
- A Dodo Payments account.

Run commands from the repo root unless noted.

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

This creates the tables, policies and storage buckets, plus the `cadence-scheduler` and `cadence-video-poller` cron jobs.

### 2. Web app

```bash
cd web && cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase → Project Settings → API). To deploy on Vercel, import the repo with **Root Directory** set to `web` and add the same two environment variables. Note the deployed URL.

### 3. Edge Function secrets

```bash
cp supabase/functions/.env.example supabase/functions/.env
```

Fill it in. Each key is explained in the file:

| Secret | Where it comes from |
| --- | --- |
| `CADENCE_INTERNAL_SECRET` | `openssl rand -hex 32` |
| `SITE_URL` | Your deployed web app, no trailing slash |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | platform.openai.com |
| `RESEND_API_KEY`, `EMAIL_FROM` | resend.com |
| `GEMINI_API_KEY` | aistudio.google.com/apikey (needs billing enabled for video) |
| `PIXABAY_API_KEY` | pixabay.com/api/docs (log in and the key is shown on the page) |
| `DODO_ENV`, `DODO_API_KEY`, `DODO_WEBHOOK_SECRET`, `DODO_PRODUCT_*` | Dodo dashboard (step 6) |

Then:

```bash
npx supabase secrets set --env-file supabase/functions/.env
```

```bash
npx supabase functions deploy
```

### 4. Turn on the cron jobs

In the Supabase SQL editor, store the two values both cron jobs read. Use the **same** secret as `CADENCE_INTERNAL_SECRET`:

```sql
select vault.create_secret('https://<project-ref>.supabase.co', 'cadence_project_url');
select vault.create_secret('<your CADENCE_INTERNAL_SECRET>', 'cadence_internal_secret');
```

The scheduler runs every 15 minutes and only does work when a workspace's local time has just passed its generation time and today's post doesn't exist yet. If Supabase was down at 5 PM, it catches up for up to 3 hours. The video poller runs every minute, but only calls the function while a video is rendering. You can see runs under **Integrations → Cron**.

### 5. Auth and Google sign-in

1. In **Authentication → URL Configuration**, set the Site URL to your web app and add `https://<your-app>/auth/callback` to the redirect URLs.
2. In Google Cloud Console, go to **APIs & Services → Credentials** and create an **OAuth client ID** of type **Web application**. Set the authorised redirect URI to `https://<project-ref>.supabase.co/auth/v1/callback`. Set up the OAuth consent screen with your app name, support email and domain.
3. In Supabase **Authentication → Sign In / Providers → Google**, turn it on and paste the client ID and secret.

Keep **Allow new users to sign up** on: it's a SaaS now.

### 6. Dodo Payments

1. Create four **subscription** products, monthly:

   | Product | Price | Secret |
   | --- | --- | --- |
   | Image Only | ₹1,499 | `DODO_PRODUCT_IMAGE_INR` |
   | Image Only | $45 | `DODO_PRODUCT_IMAGE_USD` |
   | Image + Videos | ₹2,999 | `DODO_PRODUCT_VIDEO_INR` |
   | Image + Videos | $89 | `DODO_PRODUCT_VIDEO_USD` |

2. Under **Developer → API keys**, create a key and set `DODO_API_KEY`.
3. Under **Developer → Webhooks**, add the endpoint `https://<project-ref>.supabase.co/functions/v1/dodo-webhook` and subscribe to all `subscription.*` events. Copy its signing secret (it starts with `whsec_`) into `DODO_WEBHOOK_SECRET`.
4. Start with `DODO_ENV=test` and the test-mode keys and products, then switch everything to live together.

Re-run `npx supabase secrets set --env-file supabase/functions/.env` after changing any of these. There's no need to redeploy.

### 7. Resend

Verify your sending domain in Resend and set `EMAIL_FROM` to an address on it, e.g. `Cadence <posts@yourdomain.com>`. Before the domain is verified, `onboarding@resend.dev` works but only delivers to the address you signed up to Resend with.

### 8. First run

1. Sign up and go through onboarding: business type, platforms, photos, template, schedule and plan. Picking a business type pre-fills a sensible calendar, template and platforms.
2. Press **Generate a post now** on the dashboard. About a minute later the email arrives. Videos take a few minutes longer.

## How plans work

- **Free:** 3 posts in total, all formats except video. After that the scheduler stops and sends one "pick a plan" email.
- **Image Only:** a post every day, carousels and single images.
- **Image + Videos:** adds video days. Without this plan, video days in the calendar become carousels.
- A subscription counts while Dodo reports it as `active` or `past_due`. Plan changes are prorated immediately, and the billing portal handles cancellation and card updates.

## Posting what you receive

- **Carousels:** save the attached slides (or use the post page on your phone) and post them in order. On LinkedIn, add the attached PDF as a document instead; it shows as a swipeable carousel.
- **Videos:** vertical 9:16, made for Reels, Shorts and TikTok.
- **Regenerate:** if a post isn't right, click Regenerate in the email or on the post page and say what to change. A new version arrives about a minute later.
- Links in the email work for 30 days. Only a SHA-256 hash of each link's token is stored.

## Customising

- **Slide templates:** edit `supabase/functions/_shared/slide-templates.ts`, then run `npm run sync:shared` in `web/` so the live preview matches. The sync also runs automatically before `dev` and `build`. Redeploy the functions.
- **Plans and prices:** `supabase/functions/_shared/plans.ts` (shared the same way). Prices charged come from the Dodo products, so change both.
- **Writing style, rules and video prompts:** `supabase/functions/_shared/openai.ts`.
- **Starter calendars and defaults per business type:** `web/lib/presets.ts`.
- **Model:** set `OPENAI_MODEL`, or choose one per workspace in **Settings → Generation**.

## Notes

- Slide text is rendered from templates, not by an image model, so it's always crisp and spelled right. Unsupported characters are normalised before rendering, so you never get missing-glyph boxes. Emoji stay out of slides; captions can use them.
- Each slide renders in about 0.3 to 0.7 s in its own function call, well under the Edge Functions CPU limit.
- Carousels are capped at 10 slides (Instagram's limit).
- Videos use Gemini Omni Flash (`gemini-omni-1.1-flash`) and are 720p, 9:16, with no on-screen text. A video that hasn't finished after 25 minutes is marked failed and can be regenerated.
- Stock photos come from Pixabay. Each chosen photo is copied into the `post-media` bucket (Pixabay doesn't allow hotlinking) and credited on the post page. Searches are cached for 24 hours in `stock_searches`, as Pixabay's terms require. The free limit is 100 searches a minute; if many customers generate at the same time, ask Pixabay for a higher limit. Pexels still works as a fallback if you set `PEXELS_API_KEY` from an existing key.
- Slide images and videos live in the public `post-media` bucket so email clients can show them. File paths contain random IDs.
