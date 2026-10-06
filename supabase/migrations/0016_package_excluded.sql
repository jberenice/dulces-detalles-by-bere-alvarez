-- 0016 · Cupcakes apagados dentro de una caja
-- En cada caja de cupcakes (o pastel con cupcakes) puedes apagar sabores de las categorías elegidas.
-- Los cupcakes nuevos que agregues a una categoría aparecen encendidos en las cajas que la usan.
-- Se puede ejecutar más de una vez.

alter table public.packages add column if not exists excluded uuid[] not null default '{}';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'packages_excluded_len') then
    alter table public.packages add constraint packages_excluded_len check (cardinality(excluded) <= 300);
  end if;
end $$;

-- Cupcakes que se pueden elegir: los de sus categorías menos los apagados
-- (o los que se eligieron uno por uno, en cajas anteriores)
create or replace function public.package_flavor_ids(k public.packages) returns setof uuid
language sql stable set search_path = public as $$
  select d.id from public.desserts d
   where d.user_id = k.user_id and d.active and k.mode = 'surtido'
     and case when cardinality(k.groups) > 0 then d.flavor_group_id = any(k.groups) and not (d.id = any(coalesce(k.excluded, '{}')))
              else d.id in (select (e->>'dessert_id')::uuid from jsonb_array_elements(k.items) e
                             where coalesce(e->>'dessert_id', '') ~ '^[0-9a-fA-F-]{36}$') end;
$$;
revoke execute on function public.package_flavor_ids(public.packages) from public, anon, authenticated;
