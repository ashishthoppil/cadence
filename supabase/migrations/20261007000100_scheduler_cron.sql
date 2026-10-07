-- Wake the `scheduler` Edge Function every 15 minutes. The function decides, per workspace,
-- whether it is past that workspace's local generation time (default 17:00) and whether
-- today's post already exists, so timezones and daylight saving are handled in one place.
--
-- Before this works, store two secrets in Vault (see README → "Turn on the 5 PM job"):
--   select vault.create_secret('https://<project-ref>.supabase.co', 'cadence_project_url');
--   select vault.create_secret('<same value as CADENCE_INTERNAL_SECRET>', 'cadence_internal_secret');

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'cadence-scheduler',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'cadence_project_url')
      || '/functions/v1/scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cadence-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cadence_internal_secret')
    ),
    body := jsonb_build_object('fired_at', now()),
    timeout_milliseconds := 30000
  );
  $$
);
