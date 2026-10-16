-- Cadence as a SaaS: business profile, platforms, templates, photos, video posts and billing.

-- ---------------------------------------------------------------------------
-- Workspaces: business profile, platforms, visual style, template, free-tier usage

alter table public.workspaces
  add column business_type text not null default 'other'
    check (business_type in ('saas', 'ecommerce', 'services', 'creator', 'local', 'education', 'other')),
  add column platforms text[] not null default '{linkedin,instagram}',
  add column visual_source text not null default 'none' check (visual_source in ('none', 'uploads', 'stock')),
  add column template text not null default 'midnight',
  add column brand_hashtags text[] not null default '{}',
  add column free_posts_used integer not null default 0,
  add column upgrade_notified_at timestamptz;

update public.workspaces set template = slide_theme;
update public.workspaces
  set brand_hashtags = array(select distinct t from unnest(linkedin_hashtags || instagram_hashtags) as t);

alter table public.workspaces
  drop column slide_theme,
  drop column slide_font,
  drop column linkedin_hashtags,
  drop column instagram_hashtags;

alter table public.workspaces
  add constraint workspaces_template_check check (template in (
    'midnight', 'paper', 'bold', 'mono', 'editorial', 'aurora', 'notebook', 'terminal', 'pastel', 'framed',
    'split', 'blueprint', 'pop', 'spotlight', 'photo-full', 'photo-top', 'photo-card', 'photo-polaroid',
    'photo-tint', 'photo-minimal'
  )),
  add constraint workspaces_platforms_check check (
    cardinality(platforms) > 0 and platforms <@ array['linkedin', 'instagram', 'facebook', 'x', 'tiktok']
  );

-- ---------------------------------------------------------------------------
-- Calendar and posts: video as a third format; captions per platform

alter table public.calendar_slots drop constraint calendar_slots_format_check;
alter table public.calendar_slots
  add constraint calendar_slots_format_check check (format in ('carousel', 'image', 'video', 'none'));

alter table public.posts drop constraint posts_format_check;
alter table public.posts
  add constraint posts_format_check check (format in ('carousel', 'image', 'video')),
  add column captions jsonb not null default '{}',
  add column video_path text,
  add column video_prompt text,
  add column video_job text,
  add column video_started_at timestamptz;

update public.posts set captions = jsonb_strip_nulls(jsonb_build_object(
  'linkedin', case when linkedin_caption is not null
    then jsonb_build_object('caption', linkedin_caption, 'hashtags', to_jsonb(linkedin_hashtags)) end,
  'instagram', case when instagram_caption is not null
    then jsonb_build_object('caption', instagram_caption, 'hashtags', to_jsonb(instagram_hashtags)) end
));

alter table public.posts
  drop column linkedin_caption,
  drop column linkedin_hashtags,
  drop column instagram_caption,
  drop column instagram_hashtags;

create index posts_pending_video on public.posts (created_at) where format = 'video' and status = 'generating';

-- ---------------------------------------------------------------------------
-- Photo library (product and brand photos the user uploads)

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  path text not null,
  url text not null,
  width integer,
  height integer,
  description text,
  use_count integer not null default 0,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);
create index media_assets_workspace on public.media_assets (workspace_id, created_at desc);

alter table public.media_assets enable row level security;
create policy "Owners manage their media" on public.media_assets
  for all to authenticated
  using (workspace_id = (select public.my_workspace_id()))
  with check (workspace_id = (select public.my_workspace_id()));

update storage.buckets set file_size_limit = 10485760 where id = 'brand-assets';
update storage.buckets
  set file_size_limit = 104857600,
      allowed_mime_types = array['image/jpeg', 'image/png', 'application/pdf', 'video/mp4']
  where id = 'post-media';

-- ---------------------------------------------------------------------------
-- Subscriptions (written only by the Dodo Payments webhook)

create table public.subscriptions (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  plan text not null check (plan in ('image', 'video')),
  status text not null default 'pending',
  provider text not null default 'dodo',
  subscription_id text unique,
  customer_id text,
  product_id text,
  currency text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger subscriptions_touch before update on public.subscriptions
  for each row execute function public.touch_updated_at();

alter table public.subscriptions enable row level security;
create policy "Owners read their subscription" on public.subscriptions
  for select to authenticated using (workspace_id = (select public.my_workspace_id()));
revoke insert, update, delete on public.subscriptions from anon, authenticated;

-- Lets the webhook find a workspace from the paying customer's email when metadata is missing.
create function public.workspace_for_email(lookup text) returns uuid
language sql stable security definer set search_path = '' as $$
  select w.id from public.workspaces w join auth.users u on u.id = w.owner_id
  where lower(u.email) = lower(lookup)
  limit 1
$$;
revoke execute on function public.workspace_for_email(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Poll Gemini for finished videos once a minute, but only while one is pending.

select cron.schedule(
  'cadence-video-poller',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'cadence_project_url')
      || '/functions/v1/video-poller',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cadence-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cadence_internal_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  )
  where exists (
    select 1 from public.posts where format = 'video' and status = 'generating' and video_job is not null
  );
  $$
);
