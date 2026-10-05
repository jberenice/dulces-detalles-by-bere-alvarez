-- =====================================================================
--  0013 · Paquetes y cajas ("pedidos especiales")
--   · Paquete fijo: tú defines qué trae (ej. pastel mini + 5 cupcakes)
--   · Caja surtida: la clienta elige los sabores hasta llenar N piezas
--     (ej. caja de 6 cupcakes por $192 aunque sueltos cuesten $35–$40)
--   · Las partidas de cotizaciones y pedidos guardan qué trae cada caja, así
--     producción e inventario saben qué hornear y qué descontar.
--  Ejecutar después de 0012 (se puede ejecutar más de una vez).
-- =====================================================================

create table if not exists public.packages (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users on delete cascade,
  name            text not null check (char_length(name) between 1 and 120),
  description     text check (char_length(description) <= 1000),
  image_url       text check (char_length(image_url) <= 1000),
  mode            text not null default 'surtido' check (mode in ('fijo','surtido')),
  pieces          int  not null default 6 check (pieces between 1 and 200),
  price           numeric not null default 0 check (price >= 0 and price < 10000000),
  price_mode      text not null default 'total' check (price_mode in ('total','pieza')),
  -- fijo: [{dessert_id, qty}] · surtido: [{dessert_id}] (sabores permitidos)
  items           jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array' and pg_column_size(items) < 8000),
  packaging_id    uuid references public.ingredients on delete set null,
  extra_cost      numeric not null default 0 check (extra_cost >= 0 and extra_cost < 1000000),
  store_visible   boolean not null default false,
  active          boolean not null default true,
  position        int not null default 0,
  min_notice_days int check (min_notice_days is null or min_notice_days between 0 and 90),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_packages_user on public.packages(user_id, position);

alter table public.packages enable row level security;
drop policy if exists "owner all" on public.packages;
create policy "owner all" on public.packages for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "anon needs demo" on public.packages;
create policy "anon needs demo" on public.packages as restrictive for all to authenticated
  using (not public.is_anonymous() or exists (select 1 from public.profiles where id = auth.uid() and is_demo))
  with check (not public.is_anonymous() or exists (select 1 from public.profiles where id = auth.uid() and is_demo));

drop trigger if exists trg_lock_owner on public.packages;
create trigger trg_lock_owner before update on public.packages for each row execute function public.lock_owner();
drop trigger if exists trg_touch_packages on public.packages;
create trigger trg_touch_packages before update on public.packages for each row execute function public.touch_updated_at();

-- El empaque y los postres del paquete deben ser de la misma cuenta
create or replace function public.check_package() returns trigger
language plpgsql security definer set search_path = public as $$
declare bad int;
begin
  if new.packaging_id is not null and not exists (select 1 from public.ingredients where id = new.packaging_id and user_id = new.user_id) then
    raise exception 'Referencia a un registro de otra cuenta' using errcode = '42501';
  end if;
  if jsonb_array_length(new.items) > 60 then raise exception 'Demasiados postres en el paquete'; end if;
  select count(*) into bad from jsonb_array_elements(new.items) e
   where coalesce(e->>'dessert_id', '') !~ '^[0-9a-fA-F-]{36}$'
      or not exists (select 1 from public.desserts d where d.id = (e->>'dessert_id')::uuid and d.user_id = new.user_id)
      or (new.mode = 'fijo' and coalesce((e->>'qty')::numeric, 0) <= 0);
  if bad > 0 then raise exception 'Revisa los postres del paquete' using errcode = '42501'; end if;
  return new;
end $$;
drop trigger if exists trg_check_package on public.packages;
create trigger trg_check_package before insert or update on public.packages for each row execute function public.check_package();

-- ---------------------------------------------------------------------
-- Partidas: qué paquete es y qué trae UNA caja
-- ---------------------------------------------------------------------
alter table public.quote_items add column if not exists package_id uuid references public.packages on delete set null;
alter table public.quote_items add column if not exists components jsonb not null default '[]'::jsonb;
alter table public.order_items add column if not exists package_id uuid references public.packages on delete set null;
alter table public.order_items add column if not exists components jsonb not null default '[]'::jsonb;
do $$ begin
  alter table public.quote_items add constraint quote_items_components_valid
    check (jsonb_typeof(components) = 'array' and pg_column_size(components) < 6000) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.order_items add constraint order_items_components_valid
    check (jsonb_typeof(components) = 'array' and pg_column_size(components) < 6000) not valid;
exception when duplicate_object then null; end $$;

create or replace function public.check_item_package() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.package_id is not null and not exists (select 1 from public.packages where id = new.package_id and user_id = new.user_id) then
    raise exception 'Referencia a un registro de otra cuenta' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists trg_item_package on public.quote_items;
create trigger trg_item_package before insert or update on public.quote_items for each row execute function public.check_item_package();
drop trigger if exists trg_item_package on public.order_items;
create trigger trg_item_package before insert or update on public.order_items for each row execute function public.check_item_package();

-- ---------------------------------------------------------------------
-- Contenido de una caja: fijo (de la base) o surtido (lo que eligió la clienta, validado)
-- Regresa [{dessert_id, name, qty}]
-- ---------------------------------------------------------------------
create or replace function public.package_components(p_pkg public.packages, p_choices jsonb) returns jsonb
language plpgsql stable set search_path = public as $$
declare v jsonb; v_total numeric; v_bad int;
begin
  if p_pkg.mode = 'fijo' then
    select coalesce(jsonb_agg(jsonb_build_object('dessert_id', d.id, 'name', d.name, 'qty', s.qty) order by s.ord), '[]'::jsonb) into v
      from (select (e->>'dessert_id')::uuid as id, sum((e->>'qty')::numeric) as qty, min(o) as ord
              from jsonb_array_elements(p_pkg.items) with ordinality as t(e, o) group by 1) s
      join public.desserts d on d.id = s.id and d.user_id = p_pkg.user_id and d.active;
    if jsonb_array_length(v) = 0 then raise exception 'El paquete % no está disponible', p_pkg.name; end if;
    return v;
  end if;

  if p_choices is null or jsonb_typeof(p_choices) <> 'array' or jsonb_array_length(p_choices) = 0 or jsonb_array_length(p_choices) > 60 then
    raise exception 'Elige los sabores de %', p_pkg.name;
  end if;
  select count(*) into v_bad from jsonb_array_elements(p_choices) c
   where coalesce(c->>'dessert_id', '') !~ '^[0-9a-fA-F-]{36}$'
      or coalesce(c->>'qty', '') !~ '^[0-9]{1,3}$';
  if v_bad > 0 then raise exception 'Sabores no válidos en %', p_pkg.name; end if;

  -- Solo sabores permitidos del paquete, activos y de la misma repostería
  select count(*) into v_bad from jsonb_array_elements(p_choices) c
   where (c->>'qty')::int > 0
     and not exists (select 1 from jsonb_array_elements(p_pkg.items) e
                      join public.desserts d on d.id = (e->>'dessert_id')::uuid and d.user_id = p_pkg.user_id and d.active
                     where (e->>'dessert_id')::uuid = (c->>'dessert_id')::uuid);
  if v_bad > 0 then raise exception 'Ese sabor no está disponible en %', p_pkg.name; end if;

  select coalesce(jsonb_agg(jsonb_build_object('dessert_id', d.id, 'name', d.name, 'qty', s.qty) order by d.name), '[]'::jsonb),
         coalesce(sum(s.qty), 0)
    into v, v_total
    from (select (c->>'dessert_id')::uuid as id, sum((c->>'qty')::int) as qty
            from jsonb_array_elements(p_choices) c where (c->>'qty')::int > 0 group by 1) s
    join public.desserts d on d.id = s.id;
  if v_total <> p_pkg.pieces then
    raise exception 'La caja % lleva % piezas (elegiste %)', p_pkg.name, p_pkg.pieces, v_total;
  end if;
  return v;
end $$;
revoke execute on function public.package_components(public.packages, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Inventario: también descuenta lo que traen las cajas y su empaque
-- ---------------------------------------------------------------------
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
      select p.packaging_id, sum(oi.quantity)
        from public.order_items oi
        join public.packages p on p.id = oi.package_id and p.user_id = new.user_id
       where oi.order_id = new.id and oi.user_id = new.user_id and p.packaging_id is not null
       group by p.packaging_id
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

-- ---------------------------------------------------------------------
-- Tienda: paquetes visibles
-- ---------------------------------------------------------------------
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
                 where d.user_id = p.id and d.store_visible and d.active and d.sale_price is not null), '[]'::json),
    'packages', coalesce((select json_agg(json_build_object('id', k.id, 'name', k.name, 'description', k.description,
                  'image_url', k.image_url, 'mode', k.mode, 'pieces', k.pieces, 'price', k.price,
                  'min_notice_days', greatest(coalesce(k.min_notice_days, 0),
                      coalesce((select max(coalesce(d.min_notice_days, 0)) from jsonb_array_elements(k.items) e
                                  join public.desserts d on d.id = (e->>'dessert_id')::uuid and d.user_id = p.id), 0)),
                  'options', (select coalesce(json_agg(json_build_object('dessert_id', d.id, 'name', d.name, 'image_url', d.image_url,
                                  'qty', (e->>'qty')::numeric,
                                  'price', case when d.store_visible then d.sale_price end) order by o), '[]'::json)
                                from jsonb_array_elements(k.items) with ordinality as t(e, o)
                                join public.desserts d on d.id = (e->>'dessert_id')::uuid and d.user_id = p.id and d.active))
                  order by k.position, k.name)
                  from public.packages k
                 where k.user_id = p.id and k.store_visible and k.active), '[]'::json)
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
  pk public.packages; v_comp jsonb;
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

    -- Paquete o caja surtida: precio y contenido salen de la base de datos
    if it ? 'package_id' then
      select * into pk from public.packages
       where id = (it->>'package_id')::uuid and user_id = v_owner and store_visible and active;
      continue when not found;
      v_comp := public.package_components(pk, it->'choices');
      v_desc := pk.name || ': ' || (select string_agg((c->>'qty') || ' ' || (c->>'name'), ', ') from jsonb_array_elements(v_comp) c);
      v_notice := greatest(v_notice, coalesce(pk.min_notice_days, 0),
                           coalesce((select max(coalesce(x.min_notice_days, 0)) from jsonb_array_elements(v_comp) c
                                       join public.desserts x on x.id = (c->>'dessert_id')::uuid), 0));
      insert into public.order_items (user_id, order_id, dessert_id, package_id, components, description, quantity, unit_price, position)
      values (v_owner, v_order, null, pk.id, v_comp, left(v_desc, 300), q, pk.price, v_pos);
      v_pos := v_pos + 1;
      v_sub := v_sub + q * pk.price;
      continue;
    end if;

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
grant execute on function public.place_store_order(text,text,text,text,date,text,text,text,text,jsonb,text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Paquetes de ejemplo (cuentas nuevas, demo y cuentas que aún no tienen paquetes)
-- ---------------------------------------------------------------------
create or replace function public.seed_starter_packages(p_uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_items jsonb; v_box uuid;
begin
  if exists (select 1 from public.packages where user_id = p_uid) then return; end if;
  select id into v_box from public.ingredients where user_id = p_uid and kind = 'empaque' and lower(name) = 'caja 6 cupcakes' limit 1;

  select jsonb_agg(jsonb_build_object('dessert_id', id) order by name) into v_items
    from public.desserts where user_id = p_uid and category = 'Cupcakes' and name in ('Vainilla', 'Chocolate', 'Nutella');
  if v_items is not null then
    insert into public.packages (user_id, name, description, mode, pieces, price, price_mode, items, packaging_id, store_visible, position)
    values (p_uid, 'Caja de 6 cupcakes clásicos', 'Arma tu caja con tus sabores favoritos: vainilla, chocolate o Nutella.',
            'surtido', 6, 192, 'total', v_items, v_box, true, 0);
  end if;

  select jsonb_agg(jsonb_build_object('dessert_id', id) order by name) into v_items
    from public.desserts where user_id = p_uid and category = 'Cupcakes'
     and name in ('Margarita', 'Paloma', 'Mezcal', 'Mango chamoy', 'Café de olla', 'Churro', 'Chocolate mexicano');
  if v_items is not null then
    insert into public.packages (user_id, name, description, mode, pieces, price, price_mode, items, packaging_id, store_visible, position)
    values (p_uid, 'Caja de 6 cupcakes mexicanos', 'Elige 6 de nuestros sabores mexicanos y llévatelos a $60 cada uno.',
            'surtido', 6, 360, 'pieza', v_items, v_box, true, 1);
  end if;
end $$;
revoke execute on function public.seed_starter_packages(uuid) from public, anon, authenticated;

do $$
declare r record;
begin
  for r in select distinct d.user_id from public.desserts d
            where d.category = 'Cupcakes' and d.name in ('Vainilla','Chocolate','Nutella','Margarita','Paloma')
              and not exists (select 1 from public.packages k where k.user_id = d.user_id)
  loop
    perform public.seed_starter_packages(r.user_id);
  end loop;
end $$;

notify pgrst, 'reload schema';
