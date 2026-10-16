-- Stock photo search cache. Pixabay's API terms require caching search results for 24 hours,
-- and it keeps busy evenings under the rate limit. Only Edge Functions (service role) use it.
create table public.stock_searches (
  provider text not null,
  query text not null,
  hits jsonb not null default '[]',
  fetched_at timestamptz not null default now(),
  primary key (provider, query)
);

alter table public.stock_searches enable row level security;
revoke all on public.stock_searches from anon, authenticated;
