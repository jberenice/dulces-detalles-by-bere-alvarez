-- =====================================================================
--  0010 · Funciones premium
--   1. Planes (Básico / Profesional / Premium) y vigencia por licencia
--   2. Ingresos por licencias y métricas de administración
--   3. Seguimiento de cotizaciones
--   4. Historial de precios de ingredientes (alerta de margen)
--   5. Pagos parciales y saldos por pedido
--   6. Tienda: variantes, galería, anticipación por producto, cupo diario,
--      días bloqueados y zonas de entrega
--   7. Guía de primeros pasos y recordatorio de saldo por correo
--  Ejecutar después de 0009 (se puede ejecutar más de una vez).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Planes y vigencia
-- ---------------------------------------------------------------------
alter table public.licenses add column if not exists plan text not null default 'premium';
alter table public.licenses add column if not exists billing text not null default 'vitalicia';
alter table public.licenses add column if not exists term_days int;
alter table public.licenses add column if not exists price numeric not null default 0;
do $$ begin
  alter table public.licenses add constraint licenses_plan_valid check (plan in ('basico','profesional','premium'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.licenses add constraint licenses_billing_valid check (billing in ('mensual','anual','vitalicia'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.licenses add constraint licenses_term_valid check (term_days is null or term_days between 1 and 3660);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.licenses add constraint licenses_price_valid check (price >= 0 and price < 1000000);
exception when duplicate_object then null; end $$;

-- La vigencia de una licencia mensual/anual empieza a contar cuando la usuaria la activa.
-- Antes de activarse, expires_at es la fecha límite para canjear el código.
create or replace function public.license_start_term() returns trigger
language plpgsql as $$
begin
  if old.status = 'disponible' and new.status = 'activa' then
    if new.term_days is not null then
      new.expires_at := now() + make_interval(days => new.term_days);
    elsif new.billing = 'vitalicia' and old.created_at >= '2026-10-05'::timestamptz then
      new.expires_at := null;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_license_start_term on public.licenses;
create trigger trg_license_start_term before update on public.licenses
  for each row execute function public.license_start_term();

create or replace function public.plan_rank(p_plan text) returns int
language sql immutable as $$
  select case p_plan when 'premium' then 3 when 'profesional' then 2 else 1 end;
$$;

-- Plan vigente de una cuenta (administración y demo ven todo)
create or replace function public.current_plan(p_uid uuid) returns text
language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from public.profiles where id = p_uid and (role = 'admin' or is_demo)) then 'premium'
    else coalesce((select plan from public.licenses where user_id = p_uid and status = 'activa' limit 1), 'basico')
  end;
$$;
revoke execute on function public.current_plan(uuid) from public, anon, authenticated;

create or replace function public.my_plan() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'plan', public.current_plan(auth.uid()),
    'billing', (select billing from public.licenses where user_id = auth.uid() limit 1),
    'expires_at', (select expires_at from public.licenses where user_id = auth.uid() limit 1)
  ) where auth.uid() is not null;
$$;
revoke execute on function public.my_plan() from public, anon;
grant execute on function public.my_plan() to authenticated;

-- ---------------------------------------------------------------------
-- 2. Ingresos por licencias, demos iniciadas y métricas
-- ---------------------------------------------------------------------
create table if not exists public.license_payments (
  id         uuid primary key default gen_random_uuid(),
  license_id uuid references public.licenses on delete set null,
  amount     numeric not null check (amount >= 0 and amount < 1000000),
  plan       text,
  billing    text,
  kind       text not null default 'venta' check (kind in ('venta','renovacion','otro')),
  note       text check (char_length(note) <= 200),
  paid_at    timestamptz not null default now()
);
create index if not exists idx_license_payments_paid on public.license_payments(paid_at desc);
alter table public.license_payments enable row level security;
drop policy if exists "admin all" on public.license_payments;
create policy "admin all" on public.license_payments for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.demo_starts (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now()
);
alter table public.demo_starts enable row level security;  -- sin políticas: solo funciones internas

create or replace function public.log_demo_start() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.is_demo and not coalesce(old.is_demo, false) then
    insert into public.demo_starts default values;
  end if;
  return new;
end $$;
drop trigger if exists trg_log_demo_start on public.profiles;
create trigger trg_log_demo_start after update of is_demo on public.profiles
  for each row execute function public.log_demo_start();

drop function if exists public.admin_generate_licenses(int, text, timestamptz);
create or replace function public.admin_generate_licenses(
  p_count int, p_notes text default null, p_expires timestamptz default null,
  p_plan text default 'profesional', p_billing text default 'mensual', p_price numeric default 0
) returns setof public.licenses
language plpgsql security definer set search_path = public as $$
declare i int; v public.licenses; v_term int;
begin
  if not public.is_admin() then raise exception 'Solo administradores' using errcode = '42501'; end if;
  if p_plan not in ('basico','profesional','premium') then raise exception 'Plan inválido'; end if;
  if p_billing not in ('mensual','anual','vitalicia') then raise exception 'Periodo inválido'; end if;
  v_term := case p_billing when 'mensual' then 30 when 'anual' then 365 else null end;
  for i in 1..least(greatest(p_count, 1), 200) loop
    insert into public.licenses (code, notes, expires_at, plan, billing, term_days, price)
    values (public.generate_license_code(), left(p_notes, 200), p_expires, p_plan, p_billing, v_term, greatest(coalesce(p_price, 0), 0))
    returning * into v;
    if coalesce(p_price, 0) > 0 then
      insert into public.license_payments (license_id, amount, plan, billing, kind, note)
      values (v.id, p_price, p_plan, p_billing, 'venta', left(p_notes, 200));
    end if;
    return next v;
  end loop;
end $$;
revoke execute on function public.admin_generate_licenses(int, text, timestamptz, text, text, numeric) from public, anon;
grant execute on function public.admin_generate_licenses(int, text, timestamptz, text, text, numeric) to authenticated;

-- Renovar: suma un periodo a la vigencia y registra el pago
create or replace function public.admin_renew_license(p_id uuid, p_amount numeric default 0, p_note text default null)
returns public.licenses
language plpgsql security definer set search_path = public as $$
declare v public.licenses; v_days int;
begin
  if not public.is_admin() then raise exception 'Solo administradores' using errcode = '42501'; end if;
  select * into v from public.licenses where id = p_id for update;
  if not found then raise exception 'Licencia no encontrada'; end if;
  v_days := coalesce(v.term_days, case v.billing when 'mensual' then 30 when 'anual' then 365 end);
  if v_days is null then raise exception 'Las licencias de por vida no se renuevan'; end if;
  if v.status = 'activa' then
    update public.licenses
       set expires_at = greatest(coalesce(expires_at, now()), now()) + make_interval(days => v_days)
     where id = p_id returning * into v;
  end if;
  if coalesce(p_amount, 0) > 0 then
    insert into public.license_payments (license_id, amount, plan, billing, kind, note)
    values (v.id, p_amount, v.plan, v.billing, 'renovacion', left(p_note, 200));
  end if;
  return v;
end $$;
revoke execute on function public.admin_renew_license(uuid, numeric, text) from public, anon;
grant execute on function public.admin_renew_license(uuid, numeric, text) to authenticated;

drop function if exists public.admin_list_licenses();
create or replace function public.admin_list_licenses()
returns table (id uuid, code text, status text, user_id uuid, email text, business_name text, holder_name text,
               notes text, expires_at timestamptz, session_device text, session_seen_at timestamptz,
               has_session boolean, activated_at timestamptz, created_at timestamptz,
               plan text, billing text, term_days int, price numeric, paid_total numeric)
language sql stable security definer set search_path = public as $$
  select l.id, l.code, l.status, l.user_id, p.email, p.business_name, l.holder_name, l.notes, l.expires_at,
         l.session_device, l.session_seen_at, l.active_session is not null, l.activated_at, l.created_at,
         l.plan, l.billing, l.term_days, l.price,
         coalesce((select sum(amount) from public.license_payments lp where lp.license_id = l.id), 0)
    from public.licenses l left join public.profiles p on p.id = l.user_id
   where public.is_admin()
   order by l.created_at desc;
$$;
revoke execute on function public.admin_list_licenses() from public, anon;
grant execute on function public.admin_list_licenses() to authenticated;

create or replace function public.admin_metrics() returns json
language plpgsql stable security definer set search_path = public as $$
declare v_tz text; v_month timestamptz; v_year timestamptz; r json;
begin
  if not public.is_admin() then raise exception 'Solo administradores' using errcode = '42501'; end if;
  select coalesce(timezone, 'America/Cancun') into v_tz from public.profiles where id = auth.uid();
  v_month := date_trunc('month', now() at time zone v_tz) at time zone v_tz;
  v_year  := date_trunc('year',  now() at time zone v_tz) at time zone v_tz;
  select json_build_object(
    'active',        (select count(*) from public.licenses where status = 'activa' and (expires_at is null or expires_at > now())),
    'expiring_30',   (select count(*) from public.licenses where status = 'activa' and expires_at between now() and now() + interval '30 days'),
    'expired',       (select count(*) from public.licenses where status = 'activa' and expires_at <= now()),
    'available',     (select count(*) from public.licenses where status = 'disponible'),
    'suspended',     (select count(*) from public.licenses where status = 'suspendida'),
    'new_month',     (select count(*) from public.licenses where activated_at >= v_month),
    'revenue_month', (select coalesce(sum(amount), 0) from public.license_payments where paid_at >= v_month),
    'revenue_year',  (select coalesce(sum(amount), 0) from public.license_payments where paid_at >= v_year),
    'revenue_total', (select coalesce(sum(amount), 0) from public.license_payments),
    'mrr',           (select coalesce(sum(case billing when 'mensual' then price when 'anual' then price / 12 else 0 end), 0)
                        from public.licenses where status = 'activa' and (expires_at is null or expires_at > now())),
    'demos_month',   (select count(*) from public.demo_starts where created_at >= v_month),
    'demos_total',   (select count(*) from public.demo_starts),
    'by_plan',       (select coalesce(json_object_agg(plan, n), '{}'::json) from (
                        select plan, count(*) n from public.licenses
                         where status = 'activa' and (expires_at is null or expires_at > now()) group by plan) s),
    'monthly',       (select json_agg(json_build_object(
                          'month', to_char(m, 'YYYY-MM'),
                          'activations', (select count(*) from public.licenses
                                           where activated_at >= (m at time zone v_tz) and activated_at < ((m + interval '1 month') at time zone v_tz)),
                          'revenue', (select coalesce(sum(amount), 0) from public.license_payments
                                       where paid_at >= (m at time zone v_tz) and paid_at < ((m + interval '1 month') at time zone v_tz)),
                          'demos', (select count(*) from public.demo_starts
                                     where created_at >= (m at time zone v_tz) and created_at < ((m + interval '1 month') at time zone v_tz))
                        ) order by m)
                        from generate_series(date_trunc('month', now() at time zone v_tz) - interval '11 months',
                                             date_trunc('month', now() at time zone v_tz), interval '1 month') m),
    'expiring',      (select coalesce(json_agg(x order by x.expires_at), '[]'::json) from (
                        select l.id, l.code, l.plan, l.billing, l.expires_at, p.email, p.business_name, p.whatsapp
                          from public.licenses l left join public.profiles p on p.id = l.user_id
                         where l.status = 'activa' and l.expires_at is not null and l.expires_at < now() + interval '30 days'
                         order by l.expires_at limit 20) x)
  ) into r;
  return r;
end $$;
revoke execute on function public.admin_metrics() from public, anon;
grant execute on function public.admin_metrics() to authenticated;

-- ---------------------------------------------------------------------
-- 3. Seguimiento de cotizaciones
-- ---------------------------------------------------------------------
alter table public.quotes add column if not exists followed_up_at timestamptz;
alter table public.quotes add column if not exists follow_up_count int not null default 0;
alter table public.profiles add column if not exists followup_days int not null default 3;
do $$ begin
  alter table public.profiles add constraint profiles_followup_days_valid check (followup_days between 1 and 30);
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 4. Historial de precios de ingredientes (para la alerta de margen)
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists margin_tolerance_pct numeric not null default 5;
do $$ begin
  alter table public.profiles add constraint profiles_margin_tolerance_valid check (margin_tolerance_pct between 0 and 50);
exception when duplicate_object then null; end $$;

create table if not exists public.ingredient_price_history (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  ingredient_id uuid not null references public.ingredients on delete cascade,
  old_unit_cost numeric not null,
  new_unit_cost numeric not null,
  changed_at    timestamptz not null default now()
);
create index if not exists idx_price_hist_user on public.ingredient_price_history(user_id, changed_at desc);
alter table public.ingredient_price_history enable row level security;
drop policy if exists "owner read" on public.ingredient_price_history;
create policy "owner read" on public.ingredient_price_history for select using (user_id = auth.uid());
drop policy if exists "owner delete" on public.ingredient_price_history;
create policy "owner delete" on public.ingredient_price_history for delete using (user_id = auth.uid());

create or replace function public.log_ingredient_price() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.unit_cost is distinct from old.unit_cost and old.unit_cost > 0 then
    insert into public.ingredient_price_history (user_id, ingredient_id, old_unit_cost, new_unit_cost)
    values (new.user_id, new.id, old.unit_cost, new.unit_cost);
  end if;
  return null;
end $$;
drop trigger if exists trg_log_ingredient_price on public.ingredients;
create trigger trg_log_ingredient_price after update of package_price, package_qty on public.ingredients
  for each row execute function public.log_ingredient_price();

-- ---------------------------------------------------------------------
-- 5. Pagos parciales y saldos
--    orders.deposit = total pagado (se mantiene sincronizado con order_payments)
-- ---------------------------------------------------------------------
create table if not exists public.order_payments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  order_id   uuid not null references public.orders on delete cascade,
  amount     numeric not null check (amount <> 0 and abs(amount) < 10000000),
  method     text check (char_length(method) <= 40),
  note       text check (char_length(note) <= 200),
  paid_at    timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_order_payments_order on public.order_payments(order_id);
create index if not exists idx_order_payments_user on public.order_payments(user_id, paid_at desc);
alter table public.order_payments enable row level security;
drop policy if exists "owner all" on public.order_payments;
create policy "owner all" on public.order_payments for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.enforce_payment_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.orders where id = new.order_id and user_id = new.user_id) then
    raise exception 'Referencia a un registro de otra cuenta' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists trg_same_owner on public.order_payments;
create trigger trg_same_owner before insert or update on public.order_payments
  for each row execute function public.enforce_payment_owner();
drop trigger if exists trg_lock_owner on public.order_payments;
create trigger trg_lock_owner before update on public.order_payments
  for each row execute function public.lock_owner();

-- Pedidos antiguos marcados como pagados: lo pagado es el total
update public.orders set deposit = total where payment_status = 'pagado' and deposit < total;

-- Estado de pago siempre coherente con lo pagado
create or replace function public.derive_payment_status() returns trigger
language plpgsql as $$
begin
  -- "Marcar como pagado" desde el formulario: se liquida el saldo
  if new.payment_status = 'pagado' and new.deposit < new.total
     and (tg_op = 'INSERT' or old.payment_status is distinct from 'pagado') then
    new.deposit := new.total;
  end if;
  new.deposit := greatest(coalesce(new.deposit, 0), 0);
  new.payment_status := case
    when new.total > 0 and new.deposit >= new.total then 'pagado'
    when new.deposit > 0 then 'anticipo'
    else 'pendiente' end;
  return new;
end $$;
drop trigger if exists trg_derive_payment_status on public.orders;
create trigger trg_derive_payment_status before insert or update on public.orders
  for each row execute function public.derive_payment_status();

-- Cambios de "pagado" hechos desde el pedido quedan registrados como movimiento
create or replace function public.log_order_deposit() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_delta numeric;
begin
  if coalesce(current_setting('dd.pay_sync', true), '') = 'on' then return null; end if;
  v_delta := new.deposit - (case when tg_op = 'INSERT' then 0 else coalesce(old.deposit, 0) end);
  if v_delta <> 0 then
    perform set_config('dd.pay_sync', 'on', true);
    insert into public.order_payments (user_id, order_id, amount, method, note)
    values (new.user_id, new.id, v_delta, new.payment_method,
            case when tg_op = 'INSERT' then 'Anticipo registrado al crear el pedido'
                 when v_delta < 0 then 'Ajuste' else 'Pago registrado' end);
    perform set_config('dd.pay_sync', '', true);
  end if;
  return null;
end $$;
drop trigger if exists trg_log_order_deposit on public.orders;
create trigger trg_log_order_deposit after insert or update on public.orders
  for each row execute function public.log_order_deposit();

-- Al registrar o borrar pagos se recalcula lo pagado del pedido
create or replace function public.sync_order_paid() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_order uuid := coalesce(new.order_id, old.order_id);
begin
  if coalesce(current_setting('dd.pay_sync', true), '') = 'on' then return null; end if;
  perform set_config('dd.pay_sync', 'on', true);
  update public.orders
     set deposit = coalesce((select sum(amount) from public.order_payments where order_id = v_order), 0)
   where id = v_order;
  perform set_config('dd.pay_sync', '', true);
  return null;
end $$;
drop trigger if exists trg_sync_order_paid on public.order_payments;
create trigger trg_sync_order_paid after insert or update or delete on public.order_payments
  for each row execute function public.sync_order_paid();

-- Historial inicial: un movimiento por lo ya pagado en pedidos existentes
insert into public.order_payments (user_id, order_id, amount, method, note, paid_at)
select o.user_id, o.id, o.deposit, o.payment_method, 'Saldo inicial', o.updated_at
  from public.orders o
 where o.deposit > 0 and not exists (select 1 from public.order_payments p where p.order_id = o.id);

-- ---------------------------------------------------------------------
-- 6. Tienda: variantes, galería, fechas y zonas
-- ---------------------------------------------------------------------
alter table public.desserts add column if not exists variants jsonb not null default '[]'::jsonb;
alter table public.desserts add column if not exists gallery text[] not null default '{}';
alter table public.desserts add column if not exists min_notice_days int;
do $$ begin
  alter table public.desserts add constraint desserts_variants_valid
    check (jsonb_typeof(variants) = 'array' and pg_column_size(variants) < 8000) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.desserts add constraint desserts_gallery_valid check (cardinality(gallery) <= 8) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.desserts add constraint desserts_notice_valid check (min_notice_days is null or min_notice_days between 0 and 90);
exception when duplicate_object then null; end $$;

alter table public.profiles add column if not exists store_daily_capacity int;
alter table public.profiles add column if not exists store_blocked_dates date[] not null default '{}';
alter table public.profiles add column if not exists store_zones jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists onboarding jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists balance_reminder_email boolean not null default false;
do $$ begin
  alter table public.profiles add constraint profiles_capacity_valid check (store_daily_capacity is null or store_daily_capacity between 1 and 200);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.profiles add constraint profiles_blocked_valid check (cardinality(store_blocked_dates) <= 400) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.profiles add constraint profiles_zones_valid
    check (jsonb_typeof(store_zones) = 'array' and pg_column_size(store_zones) < 4000) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.profiles add constraint profiles_onboarding_valid
    check (jsonb_typeof(onboarding) = 'object' and pg_column_size(onboarding) < 2000) not valid;
exception when duplicate_object then null; end $$;

alter table public.orders add column if not exists delivery_zone text;
alter table public.orders add column if not exists balance_reminded_at timestamptz;
do $$ begin
  alter table public.orders add constraint orders_zone_len check (char_length(delivery_zone) <= 80) not valid;
exception when duplicate_object then null; end $$;

-- Días sin cupo (bloqueados a mano o con el cupo diario lleno), según la fecha local de la repostería
create or replace function public.store_unavailable_dates(p_owner uuid) returns date[]
language sql stable security definer set search_path = public as $$
  with p as (
    select store_blocked_dates, store_daily_capacity,
           (now() at time zone coalesce(timezone, 'America/Mexico_City'))::date as today
      from public.profiles where id = p_owner
  )
  select coalesce(array_agg(distinct d order by d), '{}') from (
    select unnest(p.store_blocked_dates) d from p
    union
    select o.delivery_date from public.orders o, p
     where o.user_id = p_owner and o.status <> 'cancelado' and p.store_daily_capacity is not null
       and o.delivery_date >= p.today and o.delivery_date <= p.today + 365
     group by o.delivery_date, p.store_daily_capacity
    having count(*) >= p.store_daily_capacity
  ) s, p where s.d >= p.today;
$$;
revoke execute on function public.store_unavailable_dates(uuid) from public, anon, authenticated;

create or replace function public.get_store(p_slug text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'store', json_build_object('slug', p.store_slug, 'title', coalesce(p.store_title, p.business_name),
             'business_name', p.business_name, 'description', p.store_description, 'banner_url', p.store_banner_url,
             'logo_url', p.logo_url, 'whatsapp', p.whatsapp, 'instagram', p.instagram, 'facebook', p.facebook, 'address', p.address,
             'min_notice_days', p.store_min_notice_days, 'delivery', p.store_delivery, 'pickup', p.store_pickup,
             'shipping_fee', p.store_shipping_fee, 'theme', p.store_theme, 'about', p.store_about,
             'hours', p.store_hours, 'announcement', p.store_announcement, 'zones', p.store_zones,
             'today', (now() at time zone coalesce(p.timezone, 'America/Mexico_City'))::date,
             'unavailable_dates', public.store_unavailable_dates(p.id)),
    'products', coalesce((select json_agg(json_build_object('id', d.id, 'name', d.name, 'category', d.category,
                  'description', d.description, 'image_url', d.image_url, 'unit_label', d.unit_label,
                  'price', d.sale_price, 'featured', d.store_featured, 'variants', d.variants, 'gallery', d.gallery,
                  'min_notice_days', d.min_notice_days) order by d.store_position, d.category, d.name)
                  from public.desserts d
                 where d.user_id = p.id and d.store_visible and d.active and d.sale_price is not null), '[]'::json)
  )
  from public.profiles p
  where p.store_slug = lower(p_slug) and p.store_enabled
    and public.plan_rank(public.current_plan(p.id)) >= 2;
$$;
grant execute on function public.get_store(text) to anon, authenticated;

create or replace function public.place_store_order(
  p_slug text, p_name text, p_phone text, p_email text, p_delivery_date date, p_delivery_time text,
  p_delivery_type text, p_address text, p_notes text, p_items jsonb, p_zone text
) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid; v_profile public.profiles; v_client uuid; v_order uuid; v_folio int;
  v_sub numeric := 0; v_ship numeric := 0; v_today date; it jsonb; d public.desserts; q numeric; v_pos int := 0;
  v_notice int; v_zone text; z jsonb; g jsonb; opt jsonb; chosen text; v_price numeric; v_desc text; v_count int;
begin
  perform public.enforce_rate_limit('store_order:' || public.request_ip(), 6, interval '10 minutes');
  select * into v_profile from public.profiles where store_slug = lower(p_slug) and store_enabled;
  if not found or public.plan_rank(public.current_plan(v_profile.id)) < 2 then raise exception 'Tienda no disponible'; end if;
  v_owner := v_profile.id;
  v_today := (now() at time zone coalesce(v_profile.timezone, 'America/Mexico_City'))::date;
  v_notice := v_profile.store_min_notice_days;

  if coalesce(trim(p_name),'') = '' or coalesce(trim(p_phone),'') = '' then raise exception 'Nombre y teléfono son obligatorios'; end if;
  if length(regexp_replace(p_phone, '\D', '', 'g')) not between 8 and 15 then raise exception 'Teléfono inválido'; end if;
  if coalesce(p_email,'') <> '' and p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Correo inválido'; end if;
  if p_delivery_date is null and (v_profile.store_daily_capacity is not null or cardinality(v_profile.store_blocked_dates) > 0) then
    raise exception 'Elige la fecha de entrega';
  end if;
  if p_delivery_date is not null and p_delivery_date > v_today + 365 then raise exception 'Fecha de entrega inválida'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'Carrito inválido';
  end if;

  -- Cupo del día: se serializa por repostería y fecha para que dos pedidos simultáneos no rebasen el cupo
  if p_delivery_date is not null then
    if p_delivery_date = any(v_profile.store_blocked_dates) then
      raise exception 'Lo sentimos, el % ya no tenemos cupo. Elige otra fecha', to_char(p_delivery_date, 'DD/MM');
    end if;
    if v_profile.store_daily_capacity is not null then
      perform pg_advisory_xact_lock(hashtext(v_owner::text || p_delivery_date::text));
      select count(*) into v_count from public.orders
       where user_id = v_owner and delivery_date = p_delivery_date and status <> 'cancelado';
      if v_count >= v_profile.store_daily_capacity then
        raise exception 'Lo sentimos, el % ya no tenemos cupo. Elige otra fecha', to_char(p_delivery_date, 'DD/MM');
      end if;
    end if;
  end if;

  -- Zona de entrega
  if p_delivery_type = 'envio' then
    if not v_profile.store_delivery then raise exception 'Esta tienda no hace envíos'; end if;
    if jsonb_array_length(coalesce(v_profile.store_zones, '[]'::jsonb)) > 0 then
      select value into z from jsonb_array_elements(v_profile.store_zones) where value->>'name' = p_zone limit 1;
      if z is null then raise exception 'Elige tu zona de entrega'; end if;
      v_zone := left(z->>'name', 80);
      v_ship := greatest(coalesce((z->>'fee')::numeric, 0), 0);
    else
      v_ship := v_profile.store_shipping_fee;
    end if;
  end if;

  select id into v_client from public.clients
   where user_id = v_owner and regexp_replace(coalesce(phone,''), '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
   limit 1;
  if v_client is null then
    insert into public.clients (user_id, name, phone, email, address, source)
    values (v_owner, left(trim(p_name),120), left(p_phone,40), nullif(left(p_email,120),''), nullif(left(p_address,300),''), 'tienda')
    returning id into v_client;
  end if;

  insert into public.orders (user_id, client_id, source, status, delivery_date, delivery_time, delivery_type, delivery_address,
                             delivery_zone, customer_name, customer_phone, customer_email, notes, shipping)
  values (v_owner, v_client, 'tienda', 'pendiente', p_delivery_date, left(p_delivery_time,40),
          case when p_delivery_type = 'envio' then 'envio' else 'recoger' end, left(p_address,300), v_zone,
          left(trim(p_name),120), left(p_phone,40), nullif(left(p_email,120),''), left(p_notes,1000), v_ship)
  returning id, folio into v_order, v_folio;

  for it in select * from jsonb_array_elements(p_items) loop
    q := least(greatest(coalesce((it->>'quantity')::numeric, 0), 0), 500);
    continue when q <= 0;
    select * into d from public.desserts
     where id = (it->>'dessert_id')::uuid and user_id = v_owner and store_visible and active and sale_price is not null;
    continue when not found;

    v_price := d.sale_price;
    v_desc := d.name;
    -- Variantes: el precio sale de la base de datos, nunca del navegador
    for g in select * from jsonb_array_elements(coalesce(d.variants, '[]'::jsonb)) loop
      chosen := null;
      select o->>'option' into chosen from jsonb_array_elements(coalesce(it->'options', '[]'::jsonb)) o
       where o->>'group' = g->>'name' limit 1;
      opt := null;
      if chosen is not null then
        select value into opt from jsonb_array_elements(coalesce(g->'options', '[]'::jsonb)) where value->>'name' = chosen limit 1;
        if opt is null then raise exception 'Opción no válida en %', d.name; end if;
        v_price := v_price + greatest(coalesce((opt->>'price')::numeric, 0), 0);
        v_desc := v_desc || ' · ' || (g->>'name') || ': ' || (opt->>'name');
      elsif coalesce((g->>'required')::boolean, true) then
        raise exception 'Elige % para %', lower(g->>'name'), d.name;
      end if;
    end loop;

    v_notice := greatest(v_notice, coalesce(d.min_notice_days, 0));
    insert into public.order_items (user_id, order_id, dessert_id, description, quantity, unit_price, position)
    values (v_owner, v_order, d.id, left(v_desc, 300), q, v_price, v_pos);
    v_pos := v_pos + 1;
    v_sub := v_sub + q * v_price;
  end loop;

  if v_pos = 0 then raise exception 'Ningún producto válido en el carrito'; end if;
  if p_delivery_date is not null and p_delivery_date < v_today + v_notice then
    raise exception 'Tu pedido requiere al menos % días de anticipación', v_notice;
  end if;

  update public.orders set subtotal = v_sub, total = v_sub + v_ship where id = v_order;

  return json_build_object('order_id', v_order, 'folio', v_folio, 'subtotal', v_sub, 'shipping', v_ship,
                           'total', v_sub + v_ship, 'whatsapp', v_profile.whatsapp, 'business_name', v_profile.business_name,
                           'zone', v_zone);
end $$;

-- Firma anterior (por compatibilidad mientras se publica la nueva versión de la app)
create or replace function public.place_store_order(
  p_slug text, p_name text, p_phone text, p_email text, p_delivery_date date, p_delivery_time text,
  p_delivery_type text, p_address text, p_notes text, p_items jsonb
) returns json
language sql security definer set search_path = public as $$
  select public.place_store_order(p_slug, p_name, p_phone, p_email, p_delivery_date, p_delivery_time,
                                  p_delivery_type, p_address, p_notes, p_items, null::text);
$$;

grant execute on function public.place_store_order(text,text,text,text,date,text,text,text,text,jsonb,text) to anon, authenticated;
grant execute on function public.place_store_order(text,text,text,text,date,text,text,text,text,jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 7. Seguridad de las tablas nuevas para cuentas anónimas sin demo
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['order_payments','ingredient_price_history'] loop
    execute format('drop policy if exists "anon needs demo" on public.%I', t);
    execute format($p$create policy "anon needs demo" on public.%I as restrictive for all to authenticated
      using (not public.is_anonymous() or exists (select 1 from public.profiles where id = auth.uid() and is_demo))
      with check (not public.is_anonymous() or exists (select 1 from public.profiles where id = auth.uid() and is_demo))$p$, t);
  end loop;
end $$;

notify pgrst, 'reload schema';
