
SELECT cron.schedule(
  'award-weekly-leaderboard',
  '5 0 * * 1',
  $$ select net.http_post(
       url:='https://iqdnbmnqpgmhtaiesulr.supabase.co/functions/v1/award-weekly-leaderboard',
       headers:='{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxZG5ibW5xcGdtaHRhaWVzdWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NzA5NzEsImV4cCI6MjA4MDA0Njk3MX0.8B8ZHPQj1qh6VY1DrCYbEuj6u2sdcyPLUVsCdu84JjQ"}'::jsonb,
       body:='{}'::jsonb
     ); $$
);
