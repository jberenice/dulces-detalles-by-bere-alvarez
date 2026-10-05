-- =====================================================================
--  0014 · Crecimiento
--   1. Pastel personalizado: solicitud desde la tienda → cotización en borrador
--   2. Temporadas / fechas especiales y cupones de descuento
--   3. Reseñas con foto
--   4. Clientas frecuentes: tarjeta de sellos
--   5. Alérgenos, ingredientes y caducidad por postre
--   6. Registro de errores de la app (solo administración)
--  Ejecutar después de 0013 (se puede ejecutar más de una vez).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Almacenamiento de fotos (solo si existe el esquema storage de Supabase)
--    solicitudes: privado (fotos de referencia; las ve solo la repostería)
--    resenas: público (fotos de reseñas, nombres aleatorios)
--    respaldos: privado (respaldo diario, solo la llave de servicio)
-- ---------------------------------------------------------------------
do $$
begin
  if to_regclass('storage.buckets') is null then return; end if;
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('solicitudes', 'solicitudes', false, 3145728, array['image/jpeg','image/png','image/webp']),
         ('resenas', 'resenas', true, 3145728, array['image/jpeg','image/png','image/webp']),
         ('respaldos', 'respaldos', false, null, null)
  on conflict (id) do nothing;

  execute 'drop policy if exists "solicitudes owner read" on storage.objects';
  execute $p$create policy "solicitudes owner read" on storage.objects for select to authenticated
           using (bucket_id = 'solicitudes' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
  execute 'drop policy if exists "solicitudes owner delete" on storage.objects';
  execute $p$create policy "solicitudes owner delete" on storage.objects for delete to authenticated
           using (bucket_id = 'solicitudes' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
  execute 'drop policy if exists "resenas owner delete" on storage.objects';
  execute $p$create policy "resenas owner delete" on storage.objects for delete to authenticated
           using (bucket_id = 'resenas' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
end $$;

-- Ruta de foto subida por el servidor: <dueña>/<uuid>.<ext>
create or replace function public.valid_photo_path(p_owner uuid, p_path text) returns boolean
language sql immutable as $$
  select coalesce(p_path, '') ~ ('^' || p_owner::text || '/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$');
$$;

-- =====================================================================
-- 1. Pastel personalizado
-- =====================================================================
alter table public.profiles add column if not exists custom_cake jsonb not null default '{}'::jsonb;
do $$ begin
  alter table public.profiles add constraint profiles_custom_cake_valid
    check (jsonb_typeof(custom_cake) = 'object' and pg_column_size(custom_cake) < 6000) not valid;
exception when duplicate_object then null; end $$;

alter table public.quotes add column if not exists source text not null default 'manual';
alter table public.quotes add column if not exists request jsonb;
alter table public.quotes add column if not exists reference_images text[] not null default '{}';
alter table public.quotes add column if not exists push_notified boolean not null default false;
do $$ begin
  alter table public.quotes add constraint quotes_source_valid check (source in ('manual','tienda'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.quotes add constraint quotes_request_valid
    check (request is null or (jsonb_typeof(request) = 'object' and pg_column_size(request) < 8000)) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.quotes add constraint quotes_images_valid check (cardinality(reference_images) <= 3) not valid;
exception when duplicate_object then null; end $$;

create or replace function public.place_custom_request(p_slug text, p_request jsonb, p_images text[]) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_profile public.profiles; v_owner uuid; v_today date; v_cfg jsonb; v_notice int; v_date date; v_people int;
  v_client uuid; v_quote uuid; v_folio int; v_name text; v_phone text; v_email text; v_req jsonb; v_desc text;
  v_type text; v_zone text; z jsonb; v_img text; v_imgs text[] := '{}';
  t text := '';
begin
  perform public.enforce_rate_limit('custom_req:' || public.request_ip(), 5, interval '10 minutes');
  select * into v_profile from public.profiles where store_slug = lower(p_slug) and store_enabled;
  if not found or public.plan_rank(public.current_plan(v_profile.id)) < 2 then raise exception 'Tienda no disponible'; end if;
  v_owner := v_profile.id;
  v_cfg := coalesce(v_profile.custom_cake, '{}'::jsonb);
  if not coalesce((v_cfg->>'enabled')::boolean, false) then raise exception 'Esta tienda no recibe pasteles personalizados por aquí'; end if;
  if jsonb_typeof(p_request) <> 'object' then raise exception 'Solicitud inválida'; end if;

  v_name := left(trim(coalesce(p_request->>'name', '')), 120);
  v_phone := left(trim(coalesce(p_request->>'phone', '')), 40);
  v_email := nullif(left(trim(coalesce(p_request->>'email', '')), 120), '');
  if v_name = '' or v_phone = '' then raise exception 'Nombre y teléfono son obligatorios'; end if;
  if length(regexp_replace(v_phone, '\D', '', 'g')) not between 8 and 15 then raise exception 'Teléfono inválido'; end if;
  if v_email is not null and v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Correo inválido'; end if;

  v_today := (now() at time zone coalesce(v_profile.timezone, 'America/Mexico_City'))::date;
  v_notice := greatest(coalesce((v_cfg->>'min_notice_days')::int, 0), coalesce(v_profile.store_min_notice_days, 0));
  begin
    v_date := (p_request->>'date')::date;
  exception when others then v_date := null; end;
  if v_date is null then raise exception 'Elige la fecha del evento'; end if;
  if v_date < v_today + v_notice then raise exception 'Los pasteles personalizados se piden con al menos % días de anticipación', v_notice; end if;
  if v_date > v_today + 365 then raise exception 'Fecha inválida'; end if;
  if v_date = any(v_profile.store_blocked_dates) then
    raise exception 'Lo sentimos, el % ya no tenemos cupo. Elige otra fecha', to_char(v_date, 'DD/MM');
  end if;
  begin
    v_people := (p_request->>'people')::int;
  exception when others then v_people := null; end;
  if v_people is null or v_people not between 1 and 1000 then raise exception 'Escribe para cuántas personas es'; end if;

  v_type := case when p_request->>'delivery_type' = 'envio' and v_profile.store_delivery then 'envio' else 'recoger' end;
  if v_type = 'envio' and jsonb_array_length(coalesce(v_profile.store_zones, '[]'::jsonb)) > 0 then
    select value into z from jsonb_array_elements(v_profile.store_zones) where value->>'name' = p_request->>'zone' limit 1;
    v_zone := left(z->>'name', 80);
  end if;

  -- Fotos de referencia: máximo 3, subidas a la carpeta de esta repostería
  if p_images is not null then
    if cardinality(p_images) > 3 then raise exception 'Máximo 3 fotos de referencia'; end if;
    foreach v_img in array p_images loop
      if not public.valid_photo_path(v_owner, v_img) then raise exception 'Foto no válida'; end if;
      v_imgs := v_imgs || v_img;
    end loop;
  end if;

  -- Solo se guardan los campos conocidos y con largo limitado
  v_req := jsonb_strip_nulls(jsonb_build_object(
    'people', v_people,
    'flavor', nullif(left(trim(coalesce(p_request->>'flavor', '')), 80), ''),
    'filling', nullif(left(trim(coalesce(p_request->>'filling', '')), 80), ''),
    'topping', nullif(left(trim(coalesce(p_request->>'topping', '')), 80), ''),
    'shape', nullif(left(trim(coalesce(p_request->>'shape', '')), 80), ''),
    'design', nullif(left(trim(coalesce(p_request->>'design', '')), 1000), ''),
    'message', nullif(left(trim(coalesce(p_request->>'message', '')), 120), ''),
    'occasion', nullif(left(trim(coalesce(p_request->>'occasion', '')), 80), ''),
    'budget', case when coalesce(p_request->>'budget', '') ~ '^[0-9]{1,7}(\.[0-9]{1,2})?$' then (p_request->>'budget')::numeric end,
    'time', nullif(left(trim(coalesce(p_request->>'time', '')), 40), ''),
    'delivery_type', v_type,
    'zone', v_zone,
    'address', case when v_type = 'envio' then nullif(left(trim(coalesce(p_request->>'address', '')), 300), '') end,
    'name', v_name, 'phone', v_phone, 'email', v_email
  ));

  select id into v_client from public.clients
   where user_id = v_owner and regexp_replace(coalesce(phone,''), '\D', '', 'g') = regexp_replace(v_phone, '\D', '', 'g')
   limit 1;
  if v_client is null then
    insert into public.clients (user_id, name, phone, email, address, source)
    values (v_owner, v_name, v_phone, v_email, v_req->>'address', 'tienda')
    returning id into v_client;
  end if;

  v_desc := 'Pastel personalizado para ' || v_people || ' personas';
  if v_req ? 'flavor' then t := t || ', pan ' || (v_req->>'flavor'); end if;
  if v_req ? 'filling' then t := t || ', relleno ' || (v_req->>'filling'); end if;
  if v_req ? 'topping' then t := t || ', cubierta ' || (v_req->>'topping'); end if;
  v_desc := v_desc || t;

  insert into public.quotes (user_id, client_id, status, source, title, event_date, notes, request, reference_images, discount, shipping,
                             apply_iva, iva_pct, subtotal, iva, total)
  values (v_owner, v_client, 'borrador', 'tienda',
          left('Pastel personalizado' || coalesce(' · ' || (v_req->>'occasion'), '') || ' · ' || v_people || ' personas', 200),
          v_date,
          left(concat_ws(E'\n', 'Diseño: ' || (v_req->>'design'), 'Mensaje en el pastel: ' || (v_req->>'message')), 2000),
          v_req, v_imgs, 0, 0, false, coalesce(v_profile.iva_pct, 16), 0, 0, 0)
  returning id, folio into v_quote, v_folio;

  insert into public.quote_items (user_id, quote_id, description, quantity, unit_price, unit_cost, position)
  values (v_owner, v_quote, left(v_desc, 500), 1, 0, 0, 0);

  return json_build_object('quote_id', v_quote, 'folio', v_folio, 'whatsapp', v_profile.whatsapp, 'business_name', v_profile.business_name);
end $$;
grant execute on function public.place_custom_request(text, jsonb, text[]) to anon, authenticated;

-- =====================================================================
-- 2. Temporadas, fechas especiales y cupones
-- =====================================================================
create table if not exists public.seasons (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null check (char_length(name) between 1 and 80),
  emoji      text check (char_length(emoji) <= 16),
  start_date date not null,
  end_date   date not null,
  yearly     boolean not null default true,   -- se repite cada año en las mismas fechas
  banner     text check (char_length(banner) <= 200),
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  check (yearly or end_date >= start_date)
);
create index if not exists idx_seasons_user on public.seasons(user_id);
alter table public.seasons enable row level security;

-- Fecha en que termina la temporada vigente (para mostrar "hasta el 2 de noviembre")
create or replace function public.season_end(s public.seasons, d date) returns date
language sql immutable as $$
  select case when not s.yearly then s.end_date
    else (make_date(extract(year from d)::int
                    + case when to_char(s.end_date, 'MMDD') < to_char(d, 'MMDD') then 1 else 0 end,
                    extract(month from s.end_date)::int, 1)
          + (extract(day from s.end_date)::int - 1))::date
  end;
$$;

-- ¿La temporada está vigente en esa fecha? (las anuales comparan mes-día y pueden cruzar el año, ej. 15 dic – 6 ene)
create or replace function public.season_on(s public.seasons, d date) returns boolean
language sql immutable as $$
  select case
    when s.id is null or not s.active then false
    when not s.yearly then d between s.start_date and s.end_date
    when to_char(s.start_date, 'MMDD') <= to_char(s.end_date, 'MMDD')
      then to_char(d, 'MMDD') between to_char(s.start_date, 'MMDD') and to_char(s.end_date, 'MMDD')
    else to_char(d, 'MMDD') >= to_char(s.start_date, 'MMDD') or to_char(d, 'MMDD') <= to_char(s.end_date, 'MMDD')
  end;
$$;

alter table public.desserts add column if not exists season_id uuid references public.seasons on delete set null;
alter table public.packages add column if not exists season_id uuid references public.seasons on delete set null;

create table if not exists public.coupons (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  code         text not null check (code ~ '^[A-Z0-9_-]{3,30}$'),
  description  text check (char_length(description) <= 200),
  kind         text not null default 'porcentaje' check (kind in ('porcentaje','monto')),
  value        numeric not null check (value > 0 and value < 1000000),
  min_subtotal numeric not null default 0 check (min_subtotal >= 0),
  starts_on    date,
  ends_on      date,
  season_id    uuid references public.seasons on delete set null,
  max_uses     int check (max_uses is null or max_uses > 0),
  uses         int not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (user_id, code),
  check (kind <> 'porcentaje' or value <= 100)
);
alter table public.coupons enable row level security;

alter table public.orders add column if not exists coupon_code text check (char_length(coupon_code) <= 30);

-- =====================================================================
-- 3. Reseñas
-- =====================================================================
create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  order_id      uuid unique references public.orders on delete set null,
  client_id     uuid references public.clients on delete set null,
  token         uuid not null unique default gen_random_uuid(),
  customer_name text check (char_length(customer_name) <= 80),
  rating        int check (rating between 1 and 5),
  comment       text check (char_length(comment) <= 1000),
  photo_path    text check (char_length(photo_path) <= 200),
  submitted_at  timestamptz,
  approved      boolean not null default false,
  moderated_at  timestamptz,   -- cuándo la repostería la aprobó u ocultó
  created_at    timestamptz not null default now()
);
alter table public.reviews add column if not exists moderated_at timestamptz;
create index if not exists idx_reviews_user on public.reviews(user_id, created_at desc);
alter table public.reviews enable row level security;

-- =====================================================================
-- 4. Tarjeta de sellos
-- =====================================================================
alter table public.profiles add column if not exists loyalty jsonb not null default '{}'::jsonb;
do $$ begin
  alter table public.profiles add constraint profiles_loyalty_valid
    check (jsonb_typeof(loyalty) = 'object' and pg_column_size(loyalty) < 2000) not valid;
exception when duplicate_object then null; end $$;

create table if not exists public.loyalty_redemptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  client_id  uuid not null references public.clients on delete cascade,
  stamps     int not null check (stamps between 1 and 100),
  note       text check (char_length(note) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists idx_loyalty_client on public.loyalty_redemptions(client_id);
alter table public.loyalty_redemptions enable row level security;

-- =====================================================================
-- 5. Alérgenos, ingredientes y caducidad
-- =====================================================================
alter table public.desserts add column if not exists allergens text[] not null default '{}';
alter table public.desserts add column if not exists may_contain text[] not null default '{}';
alter table public.desserts add column if not exists ingredients_label text;
alter table public.desserts add column if not exists shelf_life_days int;
alter table public.desserts add column if not exists storage_note text;
do $$ begin
  alter table public.desserts add constraint desserts_label_valid check (
    cardinality(allergens) <= 20 and cardinality(may_contain) <= 20 and char_length(ingredients_label) <= 1500
    and (shelf_life_days is null or shelf_life_days between 0 and 365) and char_length(storage_note) <= 200) not valid;
exception when duplicate_object then null; end $$;

-- =====================================================================
-- 6. Errores de la app (solo administración; se escriben con la llave de servicio)
-- =====================================================================
create table if not exists public.app_errors (
  id          uuid primary key default gen_random_uuid(),
  fingerprint text not null unique,
  source      text not null default 'cliente' check (source in ('cliente','servidor')),
  message     text not null,
  stack       text,
  path        text,
  user_id     uuid,
  user_agent  text,
  count       int not null default 1,
  first_seen  timestamptz not null default now(),
  last_seen   timestamptz not null default now(),
  resolved    boolean not null default false
);
create index if not exists idx_app_errors_seen on public.app_errors(last_seen desc);
alter table public.app_errors enable row level security;

-- Suma una ocurrencia (o la crea). Si estaba resuelto y vuelve a pasar, se reabre.
create or replace function public.log_app_error(p_fingerprint text, p_source text, p_message text, p_stack text, p_path text, p_user uuid, p_ua text)
returns void language sql security definer set search_path = public as $$
  insert into public.app_errors as e (fingerprint, source, message, stack, path, user_id, user_agent)
  values (left(p_fingerprint, 200), case when p_source = 'servidor' then 'servidor' else 'cliente' end,
          left(coalesce(p_message, 'Error'), 1000), left(p_stack, 6000), left(p_path, 300), p_user, left(p_ua, 300))
  on conflict (fingerprint) do update
    set count = e.count + 1, last_seen = now(), resolved = false,
        path = excluded.path, user_id = coalesce(excluded.user_id, e.user_id), user_agent = excluded.user_agent;
$$;
revoke execute on function public.log_app_error(text, text, text, text, text, uuid, text) from public, anon, authenticated;

-- =====================================================================
-- Seguridad de las tablas nuevas
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array['seasons','coupons','reviews','loyalty_redemptions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "owner all" on public.%I', t);
    execute format('create policy "owner all" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('drop policy if exists "anon needs demo" on public.%I', t);
    execute format($p$create policy "anon needs demo" on public.%I as restrictive for all to authenticated
      using (not public.is_anonymous() or exists (select 1 from public.profiles where id = auth.uid() and is_demo))
      with check (not public.is_anonymous() or exists (select 1 from public.profiles where id = auth.uid() and is_demo))$p$, t);
    execute format('drop trigger if exists trg_lock_owner on public.%I', t);
    execute format('create trigger trg_lock_owner before update on public.%I for each row execute function public.lock_owner()', t);
  end loop;
end $$;

alter table public.app_errors enable row level security;
drop policy if exists "admin all" on public.app_errors;
create policy "admin all" on public.app_errors for all using (public.is_admin()) with check (public.is_admin());

-- Las referencias deben ser de la misma cuenta
create or replace function public.check_growth_refs() returns trigger
language plpgsql security definer set search_path = public as $$
declare ok boolean := true;
begin
  if tg_table_name in ('desserts','packages','coupons') then
    ok := new.season_id is null or exists (select 1 from public.seasons where id = new.season_id and user_id = new.user_id);
  elsif tg_table_name = 'reviews' then
    ok := (new.order_id is null or exists (select 1 from public.orders where id = new.order_id and user_id = new.user_id))
      and (new.client_id is null or exists (select 1 from public.clients where id = new.client_id and user_id = new.user_id));
  elsif tg_table_name = 'loyalty_redemptions' then
    ok := exists (select 1 from public.clients where id = new.client_id and user_id = new.user_id);
  end if;
  if not ok then raise exception 'Referencia a un registro de otra cuenta' using errcode = '42501'; end if;
  if tg_table_name = 'coupons' then new.code := upper(trim(new.code)); end if;
  return new;
end $$;
do $$
declare t text;
begin
  foreach t in array array['desserts','packages','coupons','reviews','loyalty_redemptions'] loop
    execute format('drop trigger if exists trg_growth_refs on public.%I', t);
    execute format('create trigger trg_growth_refs before insert or update on public.%I for each row execute function public.check_growth_refs()', t);
  end loop;
end $$;

-- La clienta no puede cambiar la reseña desde el panel de la repostería: solo aprobarla u ocultarla
create or replace function public.protect_review() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' and auth.uid() is not null then
    new.rating := old.rating; new.comment := old.comment; new.photo_path := old.photo_path;
    new.submitted_at := old.submitted_at; new.token := old.token; new.customer_name := old.customer_name;
  elsif tg_op = 'INSERT' and auth.uid() is not null then
    new.rating := null; new.comment := null; new.photo_path := null; new.submitted_at := null; new.approved := false;
  end if;
  return new;
end $$;
drop trigger if exists trg_protect_review on public.reviews;
create trigger trg_protect_review before insert or update on public.reviews for each row execute function public.protect_review();

-- =====================================================================
-- Reseñas: página pública
-- =====================================================================
create or replace function public.get_review(p_token uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'business_name', p.business_name, 'logo_url', p.logo_url, 'theme', p.store_theme, 'slug', case when p.store_enabled then p.store_slug end,
    'owner', p.id, 'customer_name', r.customer_name, 'submitted', r.submitted_at is not null, 'rating', r.rating,
    'items', (select coalesce(json_agg(i.description order by i.position), '[]'::json) from public.order_items i where i.order_id = r.order_id)
  )
  from public.reviews r join public.profiles p on p.id = r.user_id
  where r.token = p_token and r.created_at > now() - interval '120 days';
$$;
grant execute on function public.get_review(uuid) to anon, authenticated;

create or replace function public.submit_review(p_token uuid, p_rating int, p_comment text, p_name text, p_photo text) returns boolean
language plpgsql security definer set search_path = public as $$
declare r public.reviews;
begin
  perform public.enforce_rate_limit('review:' || public.request_ip(), 10, interval '10 minutes');
  select * into r from public.reviews where token = p_token and created_at > now() - interval '120 days' for update;
  if not found then raise exception 'Este enlace ya no es válido'; end if;
  if r.submitted_at is not null then raise exception 'Ya recibimos tu reseña, ¡gracias!'; end if;
  if p_rating is null or p_rating not between 1 and 5 then raise exception 'Elige de 1 a 5 estrellas'; end if;
  if p_photo is not null and p_photo <> '' and not public.valid_photo_path(r.user_id, p_photo) then raise exception 'Foto no válida'; end if;
  update public.reviews
     set rating = p_rating, comment = nullif(left(trim(coalesce(p_comment, '')), 1000), ''),
         customer_name = coalesce(nullif(left(trim(coalesce(p_name, '')), 80), ''), customer_name),
         photo_path = nullif(p_photo, ''), submitted_at = now()
   where id = r.id;
  return true;
end $$;
grant execute on function public.submit_review(uuid, int, text, text, text) to anon, authenticated;

-- =====================================================================
-- Cupones
-- =====================================================================
-- Calcula el descuento de un cupón (no lo aplica). Regresa el cupón o un mensaje de por qué no aplica.
create or replace function public.coupon_quote(p_owner uuid, p_code text, p_subtotal numeric, p_today date)
returns table (coupon_id uuid, code text, discount numeric, label text, problem text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c public.coupons; s public.seasons;
begin
  select * into c from public.coupons where user_id = p_owner and code = upper(trim(coalesce(p_code, ''))) and active;
  if not found then return query select null::uuid, null::text, 0::numeric, null::text, 'Ese cupón no existe'::text; return; end if;
  if (c.starts_on is not null and p_today < c.starts_on) or (c.ends_on is not null and p_today > c.ends_on) then
    return query select null::uuid, c.code, 0::numeric, null::text, 'Ese cupón no está vigente'::text; return;
  end if;
  if c.season_id is not null then
    select * into s from public.seasons where id = c.season_id;
    if not public.season_on(s, p_today) then return query select null::uuid, c.code, 0::numeric, null::text, 'Ese cupón es de temporada y ya no está vigente'::text; return; end if;
  end if;
  if c.max_uses is not null and c.uses >= c.max_uses then
    return query select null::uuid, c.code, 0::numeric, null::text, 'Ese cupón ya se agotó'::text; return;
  end if;
  if p_subtotal < c.min_subtotal then
    return query select null::uuid, c.code, 0::numeric, null::text, ('Ese cupón aplica en compras desde $' || to_char(c.min_subtotal, 'FM999,999,990.00'))::text; return;
  end if;
  return query select c.id, c.code,
    round(least(p_subtotal, case when c.kind = 'porcentaje' then p_subtotal * c.value / 100 else c.value end), 2),
    case when c.kind = 'porcentaje' then trim_scale(c.value)::text || '% de descuento' else '$' || to_char(c.value, 'FM999,999,990.00') || ' de descuento' end,
    null::text;
end $$;
revoke execute on function public.coupon_quote(uuid, text, numeric, date) from public, anon, authenticated;

create or replace function public.check_store_coupon(p_slug text, p_code text, p_subtotal numeric) returns json
language plpgsql security definer set search_path = public as $$
declare v_profile public.profiles; q record;
begin
  perform public.enforce_rate_limit('coupon:' || public.request_ip(), 20, interval '10 minutes');
  select * into v_profile from public.profiles where store_slug = lower(p_slug) and store_enabled;
  if not found then raise exception 'Tienda no disponible'; end if;
  select * into q from public.coupon_quote(v_profile.id, p_code, greatest(coalesce(p_subtotal, 0), 0),
                                           (now() at time zone coalesce(v_profile.timezone, 'America/Mexico_City'))::date);
  return json_build_object('ok', q.problem is null, 'code', q.code, 'discount', q.discount, 'label', q.label, 'message', q.problem);
end $$;
grant execute on function public.check_store_coupon(text, text, numeric) to anon, authenticated;

-- =====================================================================
-- Tienda: temporadas, alérgenos, reseñas y pastel personalizado
-- =====================================================================
create or replace function public.get_store(p_slug text) returns json
language sql stable security definer set search_path = public as $$
  with p as (
    select pr.*, (now() at time zone coalesce(pr.timezone, 'America/Mexico_City'))::date as today
      from public.profiles pr
     where pr.store_slug = lower(p_slug) and pr.store_enabled
       and public.plan_rank(public.current_plan(pr.id)) >= 2
  ), on_seasons as (
    select s.* from public.seasons s, p where s.user_id = p.id and public.season_on(s, p.today)
  )
  select json_build_object(
    'store', json_build_object('slug', p.store_slug, 'title', coalesce(p.store_title, p.business_name),
             'business_name', p.business_name, 'description', p.store_description, 'banner_url', p.store_banner_url,
             'logo_url', p.logo_url, 'whatsapp', p.whatsapp, 'instagram', p.instagram, 'facebook', p.facebook, 'address', p.address,
             'min_notice_days', p.store_min_notice_days, 'delivery', p.store_delivery, 'pickup', p.store_pickup,
             'shipping_fee', p.store_shipping_fee, 'theme', p.store_theme, 'about', p.store_about,
             'hours', p.store_hours, 'announcement', p.store_announcement, 'zones', p.store_zones,
             'today', p.today, 'owner', p.id,
             'unavailable_dates', public.store_unavailable_dates(p.id),
             'custom_cake', case when coalesce((p.custom_cake->>'enabled')::boolean, false) then p.custom_cake end,
             'has_coupons', exists (select 1 from public.coupons c where c.user_id = p.id and c.active)),
    'seasons', coalesce((select json_agg(json_build_object('id', s.id, 'name', s.name, 'emoji', s.emoji, 'banner', s.banner,
                  'end_date', public.season_end(s, p.today))
                  order by s.end_date) from on_seasons s), '[]'::json),
    'products', coalesce((select json_agg(json_build_object('id', d.id, 'name', d.name, 'category', d.category,
                  'description', d.description, 'image_url', d.image_url, 'unit_label', d.unit_label,
                  'price', d.sale_price, 'featured', d.store_featured, 'variants', d.variants, 'gallery', d.gallery,
                  'min_notice_days', d.min_notice_days, 'season_id', d.season_id,
                  'allergens', d.allergens, 'may_contain', d.may_contain, 'shelf_life_days', d.shelf_life_days,
                  'storage_note', d.storage_note, 'ingredients_label', d.ingredients_label)
                  order by d.store_position, d.category, d.name)
                  from public.desserts d
                 where d.user_id = p.id and d.store_visible and d.active and d.sale_price is not null
                   and (d.season_id is null or d.season_id in (select id from on_seasons))), '[]'::json),
    'packages', coalesce((select json_agg(json_build_object('id', k.id, 'name', k.name, 'description', k.description,
                  'image_url', k.image_url, 'mode', k.mode, 'pieces', k.pieces, 'price', k.price, 'season_id', k.season_id,
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
                 where k.user_id = p.id and k.store_visible and k.active
                   and (k.season_id is null or k.season_id in (select id from on_seasons))), '[]'::json),
    'reviews', coalesce((select json_agg(json_build_object('id', r.id, 'name', r.customer_name, 'rating', r.rating,
                  'comment', r.comment, 'photo_path', r.photo_path, 'date', r.submitted_at::date) order by r.submitted_at desc)
                  from (select * from public.reviews r where r.user_id = p.id and r.approved and r.submitted_at is not null
                        order by r.submitted_at desc limit 24) r), '[]'::json),
    'rating', (select json_build_object('avg', round(avg(r.rating)::numeric, 1), 'count', count(*))
                 from public.reviews r where r.user_id = p.id and r.submitted_at is not null)
  )
  from p;
$$;
grant execute on function public.get_store(text) to anon, authenticated;

-- Pedido de la tienda con cupón y respetando temporadas
create or replace function public.place_store_order(
  p_slug text, p_name text, p_phone text, p_email text, p_delivery_date date, p_delivery_time text,
  p_delivery_type text, p_address text, p_notes text, p_items jsonb, p_zone text, p_coupon text
) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid; v_profile public.profiles; v_client uuid; v_order uuid; v_folio int;
  v_sub numeric := 0; v_ship numeric := 0; v_today date; it jsonb; d public.desserts; q numeric; v_pos int := 0;
  v_notice int; v_zone text; z jsonb; g jsonb; opt jsonb; chosen text; v_price numeric; v_desc text; v_count int;
  pk public.packages; v_comp jsonb; v_disc numeric := 0; v_code text; cq record;
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

    if it ? 'package_id' then
      select k.* into pk from public.packages k
        left join public.seasons s on s.id = k.season_id
       where k.id = (it->>'package_id')::uuid and k.user_id = v_owner and k.store_visible and k.active
         and (k.season_id is null or public.season_on(s, v_today));
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

    select x.* into d from public.desserts x
      left join public.seasons s on s.id = x.season_id
     where x.id = (it->>'dessert_id')::uuid and x.user_id = v_owner and x.store_visible and x.active and x.sale_price is not null
       and (x.season_id is null or public.season_on(s, v_today));
    continue when not found;

    v_price := d.sale_price;
    v_desc := d.name;
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

  -- Cupón: se bloquea la fila para que no se use más veces de las permitidas
  if coalesce(trim(p_coupon), '') <> '' then
    perform 1 from public.coupons where user_id = v_owner and code = upper(trim(p_coupon)) for update;
    select * into cq from public.coupon_quote(v_owner, p_coupon, v_sub, v_today);
    if cq.problem is not null then raise exception '%', cq.problem; end if;
    v_disc := cq.discount;
    v_code := cq.code;
    update public.coupons set uses = uses + 1 where id = cq.coupon_id;
  end if;

  update public.orders set subtotal = v_sub, discount = v_disc, coupon_code = v_code, total = v_sub - v_disc + v_ship where id = v_order;

  return json_build_object('order_id', v_order, 'folio', v_folio, 'subtotal', v_sub, 'discount', v_disc, 'coupon', v_code,
                           'shipping', v_ship, 'total', v_sub - v_disc + v_ship, 'whatsapp', v_profile.whatsapp,
                           'business_name', v_profile.business_name, 'zone', v_zone);
end $$;

-- Firmas anteriores (compatibilidad)
create or replace function public.place_store_order(
  p_slug text, p_name text, p_phone text, p_email text, p_delivery_date date, p_delivery_time text,
  p_delivery_type text, p_address text, p_notes text, p_items jsonb, p_zone text
) returns json
language sql security definer set search_path = public as $$
  select public.place_store_order(p_slug, p_name, p_phone, p_email, p_delivery_date, p_delivery_time,
                                  p_delivery_type, p_address, p_notes, p_items, p_zone, null::text);
$$;
grant execute on function public.place_store_order(text,text,text,text,date,text,text,text,text,jsonb,text,text) to anon, authenticated;
grant execute on function public.place_store_order(text,text,text,text,date,text,text,text,text,jsonb,text) to anon, authenticated;

notify pgrst, 'reload schema';
