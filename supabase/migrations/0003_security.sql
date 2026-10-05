-- =====================================================================
--  0003 · Endurecimiento de seguridad
--  Ejecutar DESPUÉS de 0001 y 0002 (es seguro ejecutarlo más de una vez).
--  · Límite de intentos (anti fuerza bruta / spam) por IP y por usuario
--  · Aislamiento entre cuentas en referencias (nadie puede ligar datos a registros ajenos)
--  · Códigos de licencia aleatorios de 80 bits, sin consecutivos
--  · Enlaces públicos de cotización revocables / regenerables
--  · Límites de tamaño en textos y archivos
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Límite de intentos
-- ---------------------------------------------------------------------
create table if not exists public.rate_limits (
  key          text primary key,
  window_start timestamptz not null default now(),
  hits         int not null default 0
);
alter table public.rate_limits enable row level security;  -- sin políticas: nadie la lee desde la API
revoke all on public.rate_limits from anon, authenticated;

-- IP real del visitante (la manda el gateway de Supabase en x-forwarded-for)
create or replace function public.request_ip() returns text
language plpgsql stable as $$
declare h json;
begin
  begin
    h := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    h := null;
  end;
  return coalesce(nullif(trim(split_part(h->>'x-forwarded-for', ',', 1)), ''), h->>'cf-connecting-ip', 'sin-ip');
end $$;

create or replace function public.enforce_rate_limit(p_key text, p_max int, p_window interval) returns void
language plpgsql security definer set search_path = public as $$
declare v_hits int;
begin
  insert into public.rate_limits as r (key, window_start, hits) values (p_key, now(), 1)
  on conflict (key) do update set
    hits         = case when r.window_start < now() - p_window then 1 else r.hits + 1 end,
    window_start = case when r.window_start < now() - p_window then now() else r.window_start end
  returning hits into v_hits;
  if v_hits > p_max then
    raise exception 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' using errcode = 'P0429';
  end if;
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '2 days';
  end if;
end $$;
revoke execute on function public.enforce_rate_limit(text, int, interval) from public, anon, authenticated;

-- Cupo de correos por usuaria (lo usa /api/email)
create or replace function public.consume_email_quota() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'No autenticado' using errcode = '42501'; end if;
  perform public.enforce_rate_limit('email:' || auth.uid(), 40, interval '1 hour');
end $$;
revoke execute on function public.consume_email_quota() from public, anon;
grant execute on function public.consume_email_quota() to authenticated;

-- ---------------------------------------------------------------------
-- 2. Licencias: códigos aleatorios (16 caracteres, ~80 bits), con límite de intentos
-- ---------------------------------------------------------------------
-- En Supabase, pgcrypto vive en el esquema "extensions": se incluye en el search_path
create or replace function public.generate_license_code() returns text
language plpgsql volatile set search_path = public, extensions as $$
declare alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; raw text; v_code text;
begin
  loop
    -- 32 símbolos y bytes de 0-255: 256 % 32 = 0, sin sesgo
    select string_agg(substr(alphabet, 1 + (get_byte(b, 0) % 32), 1), '')
      into raw from (select gen_random_bytes(1) as b from generate_series(1, 16)) s;
    v_code := 'DD-' || substr(raw,1,4) || '-' || substr(raw,5,4) || '-' || substr(raw,9,4) || '-' || substr(raw,13,4);
    exit when not exists (select 1 from public.licenses where code = v_code);
  end loop;
  return v_code;
end $$;
revoke execute on function public.generate_license_code() from public, anon, authenticated;

create or replace function public.admin_generate_licenses(p_count int, p_notes text default null, p_expires timestamptz default null)
returns setof public.licenses
language plpgsql security definer set search_path = public as $$
declare i int;
begin
  if not public.is_admin() then raise exception 'Solo administradores' using errcode = '42501'; end if;
  for i in 1..least(greatest(p_count, 1), 200) loop
    return query insert into public.licenses (code, notes, expires_at)
      values (public.generate_license_code(), left(p_notes, 200), p_expires) returning *;
  end loop;
end $$;

create or replace function public.check_license_code(p_code text) returns boolean
language plpgsql volatile security definer set search_path = public as $$
begin
  perform public.enforce_rate_limit('license_check:' || public.request_ip(), 10, interval '15 minutes');
  return exists (
    select 1 from public.licenses
     where code = upper(trim(left(p_code, 40))) and status = 'disponible' and user_id is null
       and (expires_at is null or expires_at > now())
  );
end $$;

create or replace function public.activate_license(p_code text, p_seed boolean default true) returns json
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then return json_build_object('ok', false, 'error', 'Inicia sesión primero'); end if;
  perform public.enforce_rate_limit('license_activate:' || v_uid, 10, interval '15 minutes');
  if exists (select 1 from public.licenses where user_id = v_uid and status = 'activa') then
    return json_build_object('ok', true, 'already', true);
  end if;
  update public.licenses
     set status = 'activa', user_id = v_uid, activated_at = now()
   where code = upper(trim(left(p_code, 40))) and status = 'disponible' and user_id is null
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

-- El código de arranque predecible ya no se usa: se elimina si nadie lo activó
delete from public.licenses where code = 'DD-ADMIN-0000-0001' and user_id is null;

-- ---------------------------------------------------------------------
-- 3. Aislamiento entre cuentas: las referencias deben ser del mismo dueño
-- ---------------------------------------------------------------------
create or replace function public.enforce_same_owner() returns trigger
language plpgsql security definer set search_path = public as $$
declare ok boolean := true;
begin
  if tg_table_name = 'dessert_items' then
    ok := exists (select 1 from public.desserts where id = new.dessert_id and user_id = new.user_id)
      and exists (select 1 from public.ingredients where id = new.ingredient_id and user_id = new.user_id);
  elsif tg_table_name = 'quote_items' then
    ok := exists (select 1 from public.quotes where id = new.quote_id and user_id = new.user_id)
      and (new.dessert_id is null or exists (select 1 from public.desserts where id = new.dessert_id and user_id = new.user_id));
  elsif tg_table_name = 'order_items' then
    ok := exists (select 1 from public.orders where id = new.order_id and user_id = new.user_id)
      and (new.dessert_id is null or exists (select 1 from public.desserts where id = new.dessert_id and user_id = new.user_id));
  elsif tg_table_name = 'quotes' then
    ok := new.client_id is null or exists (select 1 from public.clients where id = new.client_id and user_id = new.user_id);
  elsif tg_table_name = 'orders' then
    ok := (new.client_id is null or exists (select 1 from public.clients where id = new.client_id and user_id = new.user_id))
      and (new.quote_id is null or exists (select 1 from public.quotes where id = new.quote_id and user_id = new.user_id));
  end if;
  if not ok then
    raise exception 'Referencia a un registro de otra cuenta' using errcode = '42501';
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['dessert_items','quote_items','order_items','quotes','orders'] loop
    execute format('drop trigger if exists trg_same_owner on public.%I', t);
    execute format('create trigger trg_same_owner before insert or update on public.%I for each row execute function public.enforce_same_owner()', t);
  end loop;
end $$;

-- Nadie puede cambiar el dueño de un registro
create or replace function public.lock_owner() returns trigger
language plpgsql as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'No se puede cambiar el dueño del registro' using errcode = '42501';
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['fixed_costs','ingredients','desserts','dessert_items','clients','quotes','quote_items','orders','order_items'] loop
    execute format('drop trigger if exists trg_lock_owner on public.%I', t);
    execute format('create trigger trg_lock_owner before update on public.%I for each row execute function public.lock_owner()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 4. Enlaces públicos: tokens aleatorios, revocables y regenerables
-- ---------------------------------------------------------------------
alter table public.quotes add column if not exists share_enabled boolean not null default true;
alter table public.orders add column if not exists public_token uuid not null default gen_random_uuid();
create unique index if not exists orders_public_token_key on public.orders(public_token);

create or replace function public.regenerate_quote_token(p_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  update public.quotes set public_token = gen_random_uuid(), share_enabled = true
   where id = p_id and user_id = auth.uid()
  returning public_token into v;
  if v is null then raise exception 'Cotización no encontrada' using errcode = '42501'; end if;
  return v;
end $$;
revoke execute on function public.regenerate_quote_token(uuid) from public, anon;
grant execute on function public.regenerate_quote_token(uuid) to authenticated;

create or replace function public.get_public_quote(p_token uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'quote', to_jsonb(q) - 'user_id' - 'client_id' - 'share_enabled' - 'sent_at',
    'client', (select json_build_object('name', c.name, 'phone', c.phone, 'email', c.email, 'address', c.address)
                 from public.clients c where c.id = q.client_id and c.user_id = q.user_id),
    'items', coalesce((select json_agg(json_build_object('description', i.description, 'quantity', i.quantity,
                       'unit_price', i.unit_price, 'total', i.total) order by i.position)
                       from public.quote_items i where i.quote_id = q.id and i.user_id = q.user_id), '[]'::json),
    'business', (select json_build_object('business_name', p.business_name, 'owner_name', p.owner_name,
                   'phone', p.phone, 'whatsapp', p.whatsapp, 'email', p.email, 'address', p.address,
                   'logo_url', p.logo_url, 'instagram', p.instagram, 'bank_info', p.bank_info,
                   'store_slug', case when p.store_enabled then p.store_slug end)
                 from public.profiles p where p.id = q.user_id)
  )
  from public.quotes q where q.public_token = p_token and q.share_enabled;
$$;

create or replace function public.accept_public_quote(p_token uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  perform public.enforce_rate_limit('quote_accept:' || public.request_ip(), 10, interval '10 minutes');
  update public.quotes set status = 'aceptada', accepted_at = now()
   where public_token = p_token and share_enabled and status in ('borrador','enviada')
     and (valid_until is null or valid_until >= current_date);
  return found;
end $$;

-- ---------------------------------------------------------------------
-- 5. Tienda: validaciones y límite de pedidos por IP
-- ---------------------------------------------------------------------
create or replace function public.place_store_order(
  p_slug text, p_name text, p_phone text, p_email text, p_delivery_date date, p_delivery_time text,
  p_delivery_type text, p_address text, p_notes text, p_items jsonb
) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid; v_profile public.profiles; v_client uuid; v_order uuid; v_folio int;
  v_sub numeric := 0; v_ship numeric := 0; it jsonb; d public.desserts; q numeric; v_pos int := 0;
begin
  perform public.enforce_rate_limit('store_order:' || public.request_ip(), 6, interval '10 minutes');
  select * into v_profile from public.profiles where store_slug = lower(p_slug) and store_enabled;
  if not found then raise exception 'Tienda no disponible'; end if;
  v_owner := v_profile.id;
  if coalesce(trim(p_name),'') = '' or coalesce(trim(p_phone),'') = '' then raise exception 'Nombre y teléfono son obligatorios'; end if;
  if length(regexp_replace(p_phone, '\D', '', 'g')) not between 8 and 15 then raise exception 'Teléfono inválido'; end if;
  if coalesce(p_email,'') <> '' and p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Correo inválido'; end if;
  if p_delivery_date is not null and p_delivery_date > current_date + 365 then raise exception 'Fecha de entrega inválida'; end if;
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
-- 6. Límites de tamaño (texto) — NOT VALID: no revisa datos existentes
-- ---------------------------------------------------------------------
do $$
declare c record;
begin
  for c in select * from (values
    ('clients','name',200), ('clients','notes',2000), ('clients','address',500),
    ('desserts','name',200), ('desserts','description',2000), ('ingredients','name',200),
    ('quotes','title',300), ('quotes','notes',4000), ('quotes','terms',4000),
    ('orders','notes',4000), ('orders','delivery_address',500),
    ('quote_items','description',500), ('order_items','description',500),
    ('profiles','business_name',200), ('profiles','quote_terms',4000), ('profiles','store_description',2000), ('profiles','bank_info',1000)
  ) as v(tbl, col, maxlen) loop
    begin
      execute format('alter table public.%I add constraint %I check (char_length(%I) <= %s) not valid',
                     c.tbl, c.tbl || '_' || c.col || '_len', c.col, c.maxlen);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 7. Storage: solo imágenes, máximo 5 MB
-- ---------------------------------------------------------------------
update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif']
 where id = 'media';

-- ---------------------------------------------------------------------
-- 8. Permisos
-- ---------------------------------------------------------------------
grant execute on function public.check_license_code(text)  to anon, authenticated;
grant execute on function public.get_public_quote(uuid)     to anon, authenticated;
grant execute on function public.accept_public_quote(uuid)  to anon, authenticated;
grant execute on function public.get_store(text)            to anon, authenticated;
grant execute on function public.place_store_order(text,text,text,text,date,text,text,text,text,jsonb) to anon, authenticated;
revoke execute on function public.admin_generate_licenses(int, text, timestamptz) from anon;
revoke execute on function public.admin_list_licenses() from anon;
revoke execute on function public.seed_starter_data(uuid) from public, anon, authenticated;

notify pgrst, 'reload schema';
