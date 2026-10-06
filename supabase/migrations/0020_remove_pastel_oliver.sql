-- =====================================================================
--  0020 · Quitar "Pastel Oliver" de las recetas de ejemplo
--   · Ya no se crea en las cuentas nuevas
--   · Se elimina de las cuentas existentes (las cotizaciones y pedidos que lo usaban
--     conservan su descripción y precio; solo pierden el enlace a la receta)
--  Ejecutar después de 0019 (se puede ejecutar más de una vez).
-- =====================================================================

-- La función original se conserva con otro nombre y la nueva la llama y quita el pastel
do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = 'seed_starter_data_base') then
    alter function public.seed_starter_data(uuid) rename to seed_starter_data_base;
  end if;
end $$;
revoke execute on function public.seed_starter_data_base(uuid) from public, anon, authenticated;

create or replace function public.seed_starter_data(p_uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.seed_starter_data_base(p_uid);
  delete from public.desserts where user_id = p_uid and name = 'Pastel Oliver';
end $$;
revoke execute on function public.seed_starter_data(uuid) from public, anon, authenticated;

-- Cuentas que ya lo tienen
delete from public.desserts where name = 'Pastel Oliver';
