-- =====================================================================
--  Recordatorios cada hora con Supabase (gratis): pg_cron + pg_net
--  Así cada usuaria recibe su resumen a la hora que eligió en SU zona horaria.
--  1) Reemplaza TU_CRON_SECRET (el mismo valor de CRON_SECRET de tu hosting).
--     Si cambias de dominio, cambia también la URL y vuelve a ejecutarlo.
--  2) Ejecuta este bloque en Supabase → SQL Editor
-- =====================================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Si ya existía, lo quitamos para volver a crearlo
select cron.unschedule('dd-recordatorios') where exists (select 1 from cron.job where jobname = 'dd-recordatorios');

select cron.schedule(
  'dd-recordatorios',
  '2 * * * *',               -- minuto 2 de cada hora
  $$
  select net.http_get(
    url     := 'https://dulcesdetallesbyberealvarez.com/api/cron/recordatorios',
    headers := jsonb_build_object('Authorization', 'Bearer TU_CRON_SECRET')
  );
  $$
);

-- Respaldo diario a las 3:07 am hora de Cancún (08:07 UTC): guarda todo en Storage → respaldos
select cron.unschedule('dd-respaldo') where exists (select 1 from cron.job where jobname = 'dd-respaldo');
select cron.schedule(
  'dd-respaldo',
  '7 8 * * *',
  $$
  select net.http_get(
    url     := 'https://dulcesdetallesbyberealvarez.com/api/cron/respaldo',
    headers := jsonb_build_object('Authorization', 'Bearer TU_CRON_SECRET'),
    timeout_milliseconds := 60000
  );
  $$
);

-- Para revisar ejecuciones:  select * from cron.job_run_details order by start_time desc limit 10;
