-- =====================================================================
--  Dulces Detalles by Bere Álvarez — Esquema principal
--  Ejecutar en Supabase → SQL Editor (o `supabase db push`)
-- =====================================================================
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Perfiles (1:1 con auth.users) — datos del negocio y parámetros de costeo
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id                  uuid primary key references auth.users on delete cascade,
  role                text not null default 'user' check (role in ('user','admin')),
  email               text,
  owner_name          text,
  business_name       text not null default 'Mi repostería',
  phone               text,
  whatsapp            text,
  address             text,
  logo_url            text,
  instagram           text,
  currency            text not null default 'MXN',
  -- Parámetros de costeo (equivalentes a tus hojas de Excel)
  days_per_month      numeric not null default 30,
  hours_per_day       numeric not null default 8,
  default_profit_pct  numeric not null default 30,
  default_wear_pct    numeric not null default 5,
  iva_pct             numeric not null default 16,
  card_fee_pct        numeric not null default 5,
  -- Cotizaciones
  quote_validity_days int not null default 15,
  quote_terms         text default 'Precios en pesos mexicanos. Se requiere un anticipo del 50% para apartar la fecha. El resto se liquida al momento de la entrega.',
  bank_info           text,
  -- Minitienda
  store_slug          text unique,
  store_enabled       boolean not null default false,
  store_title         text,
  store_description   text,
  store_banner_url    text,
  store_min_notice_days int not null default 2,
  store_delivery      boolean not null default true,
  store_pickup        boolean not null default true,
  store_shipping_fee  numeric not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint store_slug_format check (store_slug is null or store_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

-- ---------------------------------------------------------------------
-- Licencias: 1 licencia por usuario, 1 dispositivo/sesión activa a la vez
-- ---------------------------------------------------------------------
create table if not exists public.licenses (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  status          text not null default 'disponible' check (status in ('disponible','activa','suspendida')),
  user_id         uuid unique references auth.users on delete set null,
  holder_name     text,
  notes           text,
  expires_at      timestamptz,
  active_session  uuid,
  session_device  text,
  session_seen_at timestamptz,
  activated_at    timestamptz,
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Catálogos del negocio
-- ---------------------------------------------------------------------
create table if not exists public.fixed_costs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users on delete cascade,
  name           text not null,
  monthly_amount numeric not null default 0 check (monthly_amount >= 0),
  created_at     timestamptz not null default now()
);

create table if not exists public.ingredients (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  kind          text not null default 'ingrediente' check (kind in ('ingrediente','empaque')),
  name          text not null,
  unit          text not null default 'g',
  package_qty   numeric not null default 1 check (package_qty > 0),
  package_price numeric not null default 0 check (package_price >= 0),
  unit_cost     numeric generated always as (package_price / package_qty) stored,
  supplier      text,
  stock         numeric not null default 0,
  min_stock     numeric not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.desserts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users on delete cascade,
  name            text not null,
  category        text not null default 'Postres',
  description     text,
  image_url       text,
  yield_units     numeric not null default 1 check (yield_units > 0),
  unit_label      text not null default 'pieza',
  labor_hours     numeric not null default 1 check (labor_hours >= 0),
  profit_pct      numeric not null default 30,
  wear_pct        numeric not null default 5,
  shipping        numeric not null default 0,
  apply_iva       boolean not null default false,
  apply_card_fee  boolean not null default false,
  sale_price      numeric check (sale_price is null or sale_price >= 0),
  store_visible   boolean not null default false,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.dessert_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  dessert_id    uuid not null references public.desserts on delete cascade,
  ingredient_id uuid not null references public.ingredients on delete restrict,
  section       text,
  quantity      numeric not null default 0 check (quantity >= 0),
  position      int not null default 0
);

create table if not exists public.clients (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null,
  phone      text,
  email      text,
  address    text,
  birthday   date,
  notes      text,
  source     text not null default 'manual',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Cotizaciones
-- ---------------------------------------------------------------------
create table if not exists public.quotes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  folio        int,
  client_id    uuid references public.clients on delete set null,
  status       text not null default 'borrador' check (status in ('borrador','enviada','aceptada','rechazada','vencida')),
  title        text,
  event_date   date,
  valid_until  date,
  notes        text,
  terms        text,
  discount     numeric not null default 0,
  shipping     numeric not null default 0,
  apply_iva    boolean not null default false,
  iva_pct      numeric not null default 16,
  subtotal     numeric not null default 0,
  iva          numeric not null default 0,
  total        numeric not null default 0,
  public_token uuid not null default gen_random_uuid() unique,
  sent_at      timestamptz,
  accepted_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, folio)
);

create table if not exists public.quote_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  quote_id    uuid not null references public.quotes on delete cascade,
  dessert_id  uuid references public.desserts on delete set null,
  description text not null,
  quantity    numeric not null default 1 check (quantity > 0),
  unit_price  numeric not null default 0,
  unit_cost   numeric not null default 0,
  total       numeric generated always as (quantity * unit_price) stored,
  position    int not null default 0
);

-- ---------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users on delete cascade,
  folio            int,
  client_id        uuid references public.clients on delete set null,
  quote_id         uuid references public.quotes on delete set null,
  source           text not null default 'manual' check (source in ('manual','cotizacion','tienda')),
  status           text not null default 'pendiente' check (status in ('pendiente','confirmado','en_preparacion','listo','entregado','cancelado')),
  delivery_date    date,
  delivery_time    text,
  delivery_type    text not null default 'recoger' check (delivery_type in ('recoger','envio')),
  delivery_address text,
  customer_name    text,
  customer_phone   text,
  customer_email   text,
  notes            text,
  subtotal         numeric not null default 0,
  discount         numeric not null default 0,
  shipping         numeric not null default 0,
  iva              numeric not null default 0,
  total            numeric not null default 0,
  deposit          numeric not null default 0,
  payment_status   text not null default 'pendiente' check (payment_status in ('pendiente','anticipo','pagado')),
  payment_method   text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, folio)
);

create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  order_id    uuid not null references public.orders on delete cascade,
  dessert_id  uuid references public.desserts on delete set null,
  description text not null,
  quantity    numeric not null default 1 check (quantity > 0),
  unit_price  numeric not null default 0,
  unit_cost   numeric not null default 0,
  total       numeric generated always as (quantity * unit_price) stored,
  position    int not null default 0
);

-- ---------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------
create index if not exists idx_fixed_costs_user   on public.fixed_costs(user_id);
create index if not exists idx_ingredients_user   on public.ingredients(user_id, kind);
create index if not exists idx_desserts_user      on public.desserts(user_id);
create index if not exists idx_dessert_items_d    on public.dessert_items(dessert_id);
create index if not exists idx_dessert_items_i    on public.dessert_items(ingredient_id);
create index if not exists idx_clients_user       on public.clients(user_id);
create index if not exists idx_quotes_user        on public.quotes(user_id, created_at desc);
create index if not exists idx_quote_items_q      on public.quote_items(quote_id);
create index if not exists idx_orders_user        on public.orders(user_id, delivery_date);
create index if not exists idx_order_items_o      on public.order_items(order_id);
create index if not exists idx_order_items_d      on public.order_items(dessert_id);

-- ---------------------------------------------------------------------
-- Utilidades: updated_at, folios consecutivos por usuario
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','ingredients','desserts','quotes','orders'] loop
    execute format('drop trigger if exists trg_touch_%1$s on public.%1$s', t);
    execute format('create trigger trg_touch_%1$s before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

create or replace function public.assign_folio() returns trigger
language plpgsql as $$
begin
  if new.folio is null then
    perform pg_advisory_xact_lock(hashtext(tg_table_name || new.user_id::text));
    execute format('select coalesce(max(folio),0)+1 from public.%I where user_id = $1', tg_table_name)
      into new.folio using new.user_id;
  end if;
  return new;
end $$;

drop trigger if exists trg_folio_quotes on public.quotes;
create trigger trg_folio_quotes before insert on public.quotes for each row execute function public.assign_folio();
drop trigger if exists trg_folio_orders on public.orders;
create trigger trg_folio_orders before insert on public.orders for each row execute function public.assign_folio();

-- ---------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------------------
-- Row Level Security: cada usuario solo ve sus datos
-- ---------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.licenses      enable row level security;
alter table public.fixed_costs   enable row level security;
alter table public.ingredients   enable row level security;
alter table public.desserts      enable row level security;
alter table public.dessert_items enable row level security;
alter table public.clients       enable row level security;
alter table public.quotes        enable row level security;
alter table public.quote_items   enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;

drop policy if exists "profiles self read"   on public.profiles;
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self read"   on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- El rol no puede cambiarlo el propio usuario
create or replace function public.protect_profile_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end $$;
drop trigger if exists trg_protect_role on public.profiles;
create trigger trg_protect_role before update on public.profiles for each row execute function public.protect_profile_role();

drop policy if exists "licenses read" on public.licenses;
drop policy if exists "licenses admin" on public.licenses;
create policy "licenses read"  on public.licenses for select using (user_id = auth.uid() or public.is_admin());
create policy "licenses admin" on public.licenses for all using (public.is_admin()) with check (public.is_admin());

do $$
declare t text;
begin
  foreach t in array array['fixed_costs','ingredients','desserts','dessert_items','clients','quotes','quote_items','orders','order_items'] loop
    execute format('drop policy if exists "owner all" on public.%I', t);
    execute format('create policy "owner all" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Alta de usuario: crea perfil y, si trae código, activa su licencia
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_code text := upper(trim(coalesce(new.raw_user_meta_data->>'license_code','')));
  v_lic  uuid;
begin
  insert into public.profiles (id, email, owner_name, business_name, whatsapp, phone)
  values (
    new.id, new.email,
    new.raw_user_meta_data->>'owner_name',
    coalesce(nullif(new.raw_user_meta_data->>'business_name',''), 'Mi repostería'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'phone'
  ) on conflict (id) do nothing;

  if v_code <> '' then
    update public.licenses
       set status = 'activa', user_id = new.id, activated_at = now(),
           holder_name = coalesce(holder_name, new.raw_user_meta_data->>'owner_name')
     where code = v_code and status = 'disponible' and user_id is null
           and (expires_at is null or expires_at > now())
    returning id into v_lic;

    if v_lic is not null and coalesce((new.raw_user_meta_data->>'seed')::boolean, true) then
      perform public.seed_starter_data(new.id);
    end if;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Licencias: RPCs
-- ---------------------------------------------------------------------
-- Verifica (sin sesión) si un código está disponible
create or replace function public.check_license_code(p_code text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.licenses
     where code = upper(trim(p_code)) and status = 'disponible' and user_id is null
       and (expires_at is null or expires_at > now())
  );
$$;

-- Activa una licencia para el usuario actual
create or replace function public.activate_license(p_code text, p_seed boolean default true) returns json
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then return json_build_object('ok', false, 'error', 'Inicia sesión primero'); end if;
  if exists (select 1 from public.licenses where user_id = v_uid and status = 'activa') then
    return json_build_object('ok', true, 'already', true);
  end if;
  update public.licenses
     set status = 'activa', user_id = v_uid, activated_at = now()
   where code = upper(trim(p_code)) and status = 'disponible' and user_id is null
     and (expires_at is null or expires_at > now())
  returning id into v_id;
  if v_id is null then
    return json_build_object('ok', false, 'error', 'El código no existe, ya fue usado o está vencido');
  end if;
  if p_seed and not exists (select 1 from public.ingredients where user_id = v_uid) then
    perform public.seed_starter_data(v_uid);
  end if;
  return json_build_object('ok', true);
end $$;

-- Registra este dispositivo como la sesión activa (cierra cualquier otra)
create or replace function public.claim_session(p_session uuid, p_device text default null) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.licenses
     set active_session = p_session, session_device = left(p_device, 200), session_seen_at = now()
   where user_id = auth.uid() and status = 'activa';
  return found;
end $$;

-- Estado de la licencia para la sesión que navega (lo usa el middleware)
create or replace function public.license_status(p_session uuid) returns text
language plpgsql security definer set search_path = public as $$
declare l public.licenses;
begin
  if auth.uid() is null then return 'no_auth'; end if;
  if public.is_admin() then return 'ok'; end if;
  select * into l from public.licenses where user_id = auth.uid();
  if not found then return 'no_license'; end if;
  if l.status = 'suspendida' then return 'suspended'; end if;
  if l.expires_at is not null and l.expires_at < now() then return 'expired'; end if;
  if l.active_session is null or p_session is null or l.active_session <> p_session then return 'other_device'; end if;
  if l.session_seen_at is null or l.session_seen_at < now() - interval '5 minutes' then
    update public.licenses set session_seen_at = now() where id = l.id;
  end if;
  return 'ok';
end $$;

-- Libera la sesión al cerrar sesión
create or replace function public.release_session(p_session uuid) returns void
language sql security definer set search_path = public as $$
  update public.licenses set active_session = null
   where user_id = auth.uid() and active_session = p_session;
$$;

-- Admin: genera códigos de licencia
create or replace function public.admin_generate_licenses(p_count int, p_notes text default null, p_expires timestamptz default null)
returns setof public.licenses
language plpgsql security definer set search_path = public, extensions as $$
declare i int; v_code text; alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if not public.is_admin() then raise exception 'Solo administradores'; end if;
  for i in 1..least(greatest(p_count,1),200) loop
    loop
      select 'DD-' || string_agg(substr(alphabet, 1 + (get_byte(gen_random_bytes(1),0) % 32), 1), '')
        into v_code from generate_series(1,12);
      v_code := substr(v_code,1,7) || '-' || substr(v_code,8,4) || '-' || substr(v_code,12,4);
      exit when not exists (select 1 from public.licenses where code = v_code);
    end loop;
    return query insert into public.licenses (code, notes, expires_at) values (v_code, p_notes, p_expires) returning *;
  end loop;
end $$;

-- Admin: vista de licencias con correo del usuario
create or replace function public.admin_list_licenses()
returns table (id uuid, code text, status text, user_id uuid, email text, business_name text, holder_name text,
               notes text, expires_at timestamptz, session_device text, session_seen_at timestamptz,
               has_session boolean, activated_at timestamptz, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select l.id, l.code, l.status, l.user_id, p.email, p.business_name, l.holder_name, l.notes, l.expires_at,
         l.session_device, l.session_seen_at, l.active_session is not null, l.activated_at, l.created_at
    from public.licenses l left join public.profiles p on p.id = l.user_id
   where public.is_admin()
   order by l.created_at desc;
$$;

-- ---------------------------------------------------------------------
-- Público: cotización compartida por link
-- ---------------------------------------------------------------------
create or replace function public.get_public_quote(p_token uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'quote', to_jsonb(q) - 'user_id',
    'client', (select json_build_object('name', c.name, 'phone', c.phone, 'email', c.email, 'address', c.address)
                 from public.clients c where c.id = q.client_id),
    'items', coalesce((select json_agg(json_build_object('description', i.description, 'quantity', i.quantity,
                       'unit_price', i.unit_price, 'total', i.total) order by i.position)
                       from public.quote_items i where i.quote_id = q.id), '[]'::json),
    'business', (select json_build_object('business_name', p.business_name, 'owner_name', p.owner_name,
                   'phone', p.phone, 'whatsapp', p.whatsapp, 'email', p.email, 'address', p.address,
                   'logo_url', p.logo_url, 'instagram', p.instagram, 'bank_info', p.bank_info,
                   'store_slug', case when p.store_enabled then p.store_slug end)
                 from public.profiles p where p.id = q.user_id)
  )
  from public.quotes q where q.public_token = p_token;
$$;

create or replace function public.accept_public_quote(p_token uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.quotes set status = 'aceptada', accepted_at = now()
   where public_token = p_token and status in ('borrador','enviada');
  return found;
end $$;

-- ---------------------------------------------------------------------
-- Público: minitienda
-- ---------------------------------------------------------------------
create or replace function public.get_store(p_slug text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'store', json_build_object('slug', p.store_slug, 'title', coalesce(p.store_title, p.business_name),
             'business_name', p.business_name, 'description', p.store_description, 'banner_url', p.store_banner_url,
             'logo_url', p.logo_url, 'whatsapp', p.whatsapp, 'instagram', p.instagram, 'address', p.address,
             'min_notice_days', p.store_min_notice_days, 'delivery', p.store_delivery, 'pickup', p.store_pickup,
             'shipping_fee', p.store_shipping_fee),
    'products', coalesce((select json_agg(json_build_object('id', d.id, 'name', d.name, 'category', d.category,
                  'description', d.description, 'image_url', d.image_url, 'unit_label', d.unit_label,
                  'price', d.sale_price) order by d.category, d.name)
                  from public.desserts d
                 where d.user_id = p.id and d.store_visible and d.active and d.sale_price is not null), '[]'::json)
  )
  from public.profiles p where p.store_slug = lower(p_slug) and p.store_enabled;
$$;

create or replace function public.place_store_order(
  p_slug text, p_name text, p_phone text, p_email text, p_delivery_date date, p_delivery_time text,
  p_delivery_type text, p_address text, p_notes text, p_items jsonb
) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid; v_profile public.profiles; v_client uuid; v_order uuid; v_folio int;
  v_sub numeric := 0; v_ship numeric := 0; it jsonb; d public.desserts; q numeric; v_pos int := 0;
begin
  select * into v_profile from public.profiles where store_slug = lower(p_slug) and store_enabled;
  if not found then raise exception 'Tienda no disponible'; end if;
  v_owner := v_profile.id;
  if coalesce(trim(p_name),'') = '' or coalesce(trim(p_phone),'') = '' then raise exception 'Nombre y teléfono son obligatorios'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'Carrito inválido';
  end if;
  if p_delivery_date is not null and p_delivery_date < current_date + v_profile.store_min_notice_days then
    raise exception 'La fecha de entrega requiere al menos % días de anticipación', v_profile.store_min_notice_days;
  end if;

  select id into v_client from public.clients
   where user_id = v_owner and regexp_replace(coalesce(phone,''), '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
   limit 1;
  if v_client is null then
    insert into public.clients (user_id, name, phone, email, address, source)
    values (v_owner, left(trim(p_name),120), left(p_phone,40), nullif(left(p_email,120),''), nullif(left(p_address,300),''), 'tienda')
    returning id into v_client;
  end if;

  if p_delivery_type = 'envio' then v_ship := v_profile.store_shipping_fee; end if;

  insert into public.orders (user_id, client_id, source, status, delivery_date, delivery_time, delivery_type, delivery_address,
                             customer_name, customer_phone, customer_email, notes, shipping)
  values (v_owner, v_client, 'tienda', 'pendiente', p_delivery_date, left(p_delivery_time,40),
          case when p_delivery_type = 'envio' then 'envio' else 'recoger' end, left(p_address,300),
          left(trim(p_name),120), left(p_phone,40), nullif(left(p_email,120),''), left(p_notes,1000), v_ship)
  returning id, folio into v_order, v_folio;

  for it in select * from jsonb_array_elements(p_items) loop
    q := least(greatest(coalesce((it->>'quantity')::numeric, 0), 0), 500);
    continue when q <= 0;
    select * into d from public.desserts
     where id = (it->>'dessert_id')::uuid and user_id = v_owner and store_visible and active and sale_price is not null;
    continue when not found;
    insert into public.order_items (user_id, order_id, dessert_id, description, quantity, unit_price, position)
    values (v_owner, v_order, d.id, d.name, q, d.sale_price, v_pos);
    v_pos := v_pos + 1;
    v_sub := v_sub + q * d.sale_price;
  end loop;

  if v_pos = 0 then raise exception 'Ningún producto válido en el carrito'; end if;

  update public.orders set subtotal = v_sub, total = v_sub + v_ship where id = v_order;

  return json_build_object('order_id', v_order, 'folio', v_folio, 'subtotal', v_sub, 'shipping', v_ship,
                           'total', v_sub + v_ship, 'whatsapp', v_profile.whatsapp, 'business_name', v_profile.business_name);
end $$;

-- ---------------------------------------------------------------------
-- Permisos de ejecución
-- ---------------------------------------------------------------------
revoke execute on function public.admin_generate_licenses(int, text, timestamptz) from anon;
revoke execute on function public.admin_list_licenses() from anon;
grant execute on function public.check_license_code(text)       to anon, authenticated;
grant execute on function public.get_public_quote(uuid)          to anon, authenticated;
grant execute on function public.accept_public_quote(uuid)       to anon, authenticated;
grant execute on function public.get_store(text)                 to anon, authenticated;
grant execute on function public.place_store_order(text,text,text,text,date,text,text,text,text,jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Storage: imágenes de postres, logos y banners (carpeta = id del usuario)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media public read"  on storage.objects;
drop policy if exists "media owner insert" on storage.objects;
drop policy if exists "media owner update" on storage.objects;
drop policy if exists "media owner delete" on storage.objects;
create policy "media public read"  on storage.objects for select using (bucket_id = 'media');
create policy "media owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media owner update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
