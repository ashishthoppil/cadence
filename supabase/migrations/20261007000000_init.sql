-- Cadence: a daily AI-written post, emailed to you ready to publish.

-- ---------------------------------------------------------------------------
-- Workspaces: one per user. Holds the brand profile, look & feel and schedule.

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,

  -- Brand & voice
  brand_name text not null default '',
  website text,
  description text,
  products text,
  audience text,
  tone text,
  cta text,
  handle text,
  language text not null default 'en-GB',
  avoid text,
  linkedin_hashtags text[] not null default '{}',
  instagram_hashtags text[] not null default '{}',

  -- Look & feel
  primary_color text not null default '#6D28D9',
  accent_color text,
  slide_theme text not null default 'midnight' check (slide_theme in ('midnight', 'paper', 'bold')),
  slide_font text not null default 'inter' check (slide_font in ('inter', 'jakarta', 'editorial')),
  logo_url text,
  logo_aspect real,
  logo_inverse_url text,
  logo_inverse_aspect real,
  carousel_length smallint not null default 7 check (carousel_length between 4 and 10),

  -- Schedule & delivery
  approval_email text,
  timezone text not null default 'UTC',
  generate_at time not null default '17:00',
  paused boolean not null default false,
  ai_model text,
  onboarded_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Weekly content calendar: what the daily static post / carousel covers.

create table public.calendar_slots (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7), -- ISO weekday, 1 = Monday
  format text not null default 'carousel' check (format in ('carousel', 'image', 'none')),
  theme text not null default '',
  brief text not null default '',
  other_content text not null default '', -- e.g. planned videos; included as a reminder in the email
  primary key (workspace_id, weekday)
);

-- ---------------------------------------------------------------------------
-- Posts: one generated post/carousel and its delivery state.

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  post_date date not null,
  weekday smallint not null check (weekday between 1 and 7),
  origin text not null default 'schedule' check (origin in ('schedule', 'manual', 'regenerate')),
  format text not null check (format in ('carousel', 'image')),
  theme text,
  brief text,
  other_content text,
  status text not null default 'generating' check (status in ('generating', 'ready', 'superseded', 'failed')),
  title text,
  slides jsonb not null default '[]',
  image_paths text[] not null default '{}',
  pdf_path text,
  linkedin_caption text,
  linkedin_hashtags text[] not null default '{}',
  instagram_caption text,
  instagram_hashtags text[] not null default '{}',
  alt_text text,
  feedback text,
  model text,
  review_token_hash text unique,
  review_expires_at timestamptz,
  emailed_at timestamptz,
  replaced_by uuid references public.posts (id) on delete set null,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The scheduler creates at most one post per workspace per local day.
create unique index posts_one_scheduled_per_day on public.posts (workspace_id, post_date) where origin = 'schedule';
create index posts_workspace_recent on public.posts (workspace_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at bookkeeping

create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger workspaces_touch before update on public.workspaces
  for each row execute function public.touch_updated_at();
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security

create function public.my_workspace_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.workspaces where owner_id = auth.uid()
$$;

alter table public.workspaces enable row level security;
alter table public.calendar_slots enable row level security;
alter table public.posts enable row level security;

create policy "Owners read their workspace" on public.workspaces
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "Owners create their workspace" on public.workspaces
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "Owners update their workspace" on public.workspaces
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy "Owners manage their calendar" on public.calendar_slots
  for all to authenticated
  using (workspace_id = (select public.my_workspace_id()))
  with check (workspace_id = (select public.my_workspace_id()));

create policy "Owners read their posts" on public.posts
  for select to authenticated using (workspace_id = (select public.my_workspace_id()));

-- Posts are only ever written by Edge Functions.
revoke insert, update, delete on public.posts from anon, authenticated;

-- Live status updates in the dashboard
alter publication supabase_realtime add table public.posts;

-- ---------------------------------------------------------------------------
-- Storage: generated slides (public so email clients can show them) and brand logos.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('post-media', 'post-media', true, 52428800, array['image/jpeg', 'image/png', 'application/pdf']),
  ('brand-assets', 'brand-assets', true, 5242880, array['image/png', 'image/jpeg', 'image/svg+xml'])
on conflict (id) do nothing;

create policy "Owners read their brand assets" on storage.objects
  for select to authenticated
  using (bucket_id = 'brand-assets' and (storage.foldername(name))[1] = (select public.my_workspace_id())::text);
create policy "Owners upload brand assets" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'brand-assets' and (storage.foldername(name))[1] = (select public.my_workspace_id())::text);
create policy "Owners replace brand assets" on storage.objects
  for update to authenticated
  using (bucket_id = 'brand-assets' and (storage.foldername(name))[1] = (select public.my_workspace_id())::text);
create policy "Owners delete brand assets" on storage.objects
  for delete to authenticated
  using (bucket_id = 'brand-assets' and (storage.foldername(name))[1] = (select public.my_workspace_id())::text);
