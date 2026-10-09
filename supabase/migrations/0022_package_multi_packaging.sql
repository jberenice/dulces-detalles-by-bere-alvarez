-- Cajas y paquetes: varios empaques por paquete (caja + vaso + papel, etc.)
-- Todos se cobran a la clienta (se suman al precio del paquete), cuentan en el costo y descuentan inventario.
-- Es seguro correrla más de una vez.

alter table public.packages add column if not exists packaging_ids uuid[] not null default '{}';
do $$ begin
  alter table public.packages add constraint packages_packaging_ids_valid check (cardinality(packaging_ids) <= 12) not valid;
exception when duplicate_object then null; end $$;

create or replace function public.check_package_packaging() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.packaging_ids := coalesce((select array_agg(distinct x) from unnest(new.packaging_ids) x where x is not null and x is distinct from new.packaging_id), '{}'::uuid[]);
  if exists (select 1 from unnest(new.packaging_ids) pid where not exists (select 1 from public.ingredients i where i.id = pid and i.user_id = new.user_id)) then
    raise exception 'Referencia a un registro de otra cuenta' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists trg_check_package_packaging on public.packages;
create trigger trg_check_package_packaging before insert or update on public.packages for each row execute function public.check_package_packaging();

-- Precio de los empaques que se le cobran a la clienta (principal + adicionales)
create or replace function public.package_box_price(k public.packages) returns numeric
language sql stable set search_path = public as $$
  select coalesce((select sum(round(i.unit_cost::numeric, 2)) from public.ingredients i
                    where i.user_id = k.user_id
                      and (i.id = k.packaging_id or i.id = any(coalesce(k.packaging_ids, '{}'::uuid[])))), 0);
$$;
revoke execute on function public.package_box_price(public.packages) from public, anon, authenticated;

-- Inventario: descuenta también los empaques adicionales
create or replace function public.apply_order_inventory() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_enabled boolean; v_sign int; r record;
begin
  if new.status is not distinct from old.status then return new; end if;
  select inventory_enabled into v_enabled from public.profiles where id = new.user_id;

  if new.status = 'entregado' and not new.inventory_applied and coalesce(v_enabled, false) then
    v_sign := -1;
  elsif old.status = 'entregado' and new.status <> 'entregado' and old.inventory_applied then
    v_sign := 1;
  else
    return new;
  end if;

  for r in
    with lines as (
      select oi.dessert_id, oi.quantity::numeric as qty
        from public.order_items oi
       where oi.order_id = new.id and oi.user_id = new.user_id and oi.dessert_id is not null
         and jsonb_array_length(oi.components) = 0
      union all
      select (c->>'dessert_id')::uuid, oi.quantity * coalesce((c->>'qty')::numeric, 0)
        from public.order_items oi, jsonb_array_elements(oi.components) c
       where oi.order_id = new.id and oi.user_id = new.user_id
         and coalesce(c->>'dessert_id', '') ~ '^[0-9a-fA-F-]{36}$'
    ), needs as (
      select di.ingredient_id, sum(di.quantity * l.qty / nullif(d.yield_units, 0)) as qty
        from lines l
        join public.desserts d on d.id = l.dessert_id and d.user_id = new.user_id
        join public.dessert_items di on di.dessert_id = d.id
       group by di.ingredient_id
      union all
      select pk.pid, sum(oi.quantity)
        from public.order_items oi
        join public.packages p on p.id = oi.package_id and p.user_id = new.user_id
        cross join lateral unnest(array_remove(array[p.packaging_id] || coalesce(p.packaging_ids, '{}'::uuid[]), null)) as pk(pid)
       where oi.order_id = new.id and oi.user_id = new.user_id
       group by pk.pid
    )
    select ingredient_id, sum(qty) as qty from needs group by ingredient_id
  loop
    continue when r.qty is null or r.qty = 0;
    update public.ingredients set stock = stock + v_sign * r.qty where id = r.ingredient_id and user_id = new.user_id;
    insert into public.inventory_movements (user_id, ingredient_id, order_id, quantity, reason)
    values (new.user_id, r.ingredient_id, new.id, v_sign * r.qty,
            case when v_sign < 0 then 'pedido_entregado' else 'pedido_revertido' end);
  end loop;

  new.inventory_applied := (v_sign = -1);
  return new;
end $$;

notify pgrst, 'reload schema';
