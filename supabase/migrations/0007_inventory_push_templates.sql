-- =====================================================================
--  0007 · Inventario automático, notificaciones push y plantillas de mensajes
--  Ejecutar después de 0006 (se puede ejecutar más de una vez).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Preferencias por usuaria
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists inventory_enabled boolean not null default false;
alter table public.profiles add column if not exists message_templates jsonb not null default '{}'::jsonb;
do $$ begin
  alter table public.profiles add constraint profiles_templates_valid
    check (jsonb_typeof(message_templates) = 'object' and pg_column_size(message_templates) < 16000) not valid;
exception when duplicate_object then null; end $$;

alter table public.orders add column if not exists inventory_applied boolean not null default false;
alter table public.orders add column if not exists push_notified boolean not null default false;

-- ---------------------------------------------------------------------
-- 2. Movimientos de inventario (compras, ajustes y consumo por pedidos)
-- ---------------------------------------------------------------------
create table if not exists public.inventory_movements (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  ingredient_id uuid not null references public.ingredients on delete cascade,
  order_id      uuid references public.orders on delete set null,
  quantity      numeric not null,
  reason        text not null default 'ajuste' check (reason in ('compra','ajuste','pedido_entregado','pedido_revertido','merma')),
  note          text check (char_length(note) <= 300),
  unit_price    numeric,
  created_at    timestamptz not null default now()
);
create index if not exists idx_inv_mov_user on public.inventory_movements(user_id, created_at desc);
create index if not exists idx_inv_mov_ing on public.inventory_movements(ingredient_id);
alter table public.inventory_movements enable row level security;
drop policy if exists "owner all" on public.inventory_movements;
create policy "owner all" on public.inventory_movements for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.enforce_movement_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.ingredients where id = new.ingredient_id and user_id = new.user_id)
     or (new.order_id is not null and not exists (select 1 from public.orders where id = new.order_id and user_id = new.user_id)) then
    raise exception 'Referencia a un registro de otra cuenta' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists trg_same_owner on public.inventory_movements;
create trigger trg_same_owner before insert or update on public.inventory_movements
  for each row execute function public.enforce_movement_owner();

-- Registrar compra / ajuste de existencias (aplica RLS de la usuaria)
create or replace function public.adjust_stock(p_ingredient uuid, p_delta numeric, p_reason text default 'ajuste',
                                               p_note text default null, p_package_price numeric default null)
returns numeric
language plpgsql set search_path = public as $$
declare v_stock numeric;
begin
  if p_reason not in ('compra','ajuste','merma') then raise exception 'Motivo inválido'; end if;
  update public.ingredients
     set stock = stock + p_delta,
         package_price = coalesce(p_package_price, package_price)
   where id = p_ingredient and user_id = auth.uid()
  returning stock into v_stock;
  if v_stock is null then raise exception 'Ingrediente no encontrado' using errcode = '42501'; end if;
  insert into public.inventory_movements (ingredient_id, quantity, reason, note, unit_price)
  values (p_ingredient, p_delta, p_reason, left(p_note, 300), p_package_price);
  return v_stock;
end $$;
revoke execute on function public.adjust_stock(uuid, numeric, text, text, numeric) from anon;
grant execute on function public.adjust_stock(uuid, numeric, text, text, numeric) to authenticated;

-- Al marcar un pedido como ENTREGADO se descuentan sus ingredientes y empaques;
-- si se regresa a otro estado, se devuelven. Solo si la usuaria activó el inventario.
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
    select di.ingredient_id, sum(di.quantity * oi.quantity / nullif(d.yield_units, 0)) as qty
      from public.order_items oi
      join public.desserts d on d.id = oi.dessert_id and d.user_id = new.user_id
      join public.dessert_items di on di.dessert_id = d.id
     where oi.order_id = new.id and oi.user_id = new.user_id
     group by di.ingredient_id
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
drop trigger if exists trg_order_inventory on public.orders;
create trigger trg_order_inventory before update of status on public.orders
  for each row execute function public.apply_order_inventory();

-- ---------------------------------------------------------------------
-- 3. Suscripciones a notificaciones push (app instalada en el celular)
-- ---------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  endpoint   text not null unique check (char_length(endpoint) <= 1000 and endpoint like 'https://%'),
  p256dh     text not null check (char_length(p256dh) <= 200),
  auth       text not null check (char_length(auth) <= 100),
  device     text check (char_length(device) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists idx_push_user on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
drop policy if exists "owner all" on public.push_subscriptions;
create policy "owner all" on public.push_subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

notify pgrst, 'reload schema';
