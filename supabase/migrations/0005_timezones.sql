-- =====================================================================
--  0005 · Zona horaria por usuaria
--  Cada repostería tiene su zona horaria (Cancún, Centro, Pacífico…):
--  recordatorios, fechas mínimas de la tienda y vigencias usan su hora local.
--  Ejecutar después de 0004 (se puede ejecutar más de una vez).
-- =====================================================================
alter table public.profiles add column if not exists timezone text not null default 'America/Mexico_City';
alter table public.profiles add column if not exists timezone_confirmed boolean not null default false;
alter table public.profiles add column if not exists reminder_hour int not null default 7;
alter table public.profiles add column if not exists reminder_last_sent date;

do $$ begin
  alter table public.profiles add constraint profiles_reminder_hour_range check (reminder_hour between 0 and 23);
exception when duplicate_object then null; end $$;

-- Solo se aceptan zonas horarias válidas (IANA, p. ej. America/Cancun)
create or replace function public.validate_timezone() returns trigger
language plpgsql as $$
begin
  if new.timezone is distinct from old.timezone then
    if not exists (select 1 from pg_timezone_names where name = new.timezone) then
      raise exception 'Zona horaria inválida: %', new.timezone using errcode = '22023';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_validate_timezone on public.profiles;
create trigger trg_validate_timezone before update on public.profiles
  for each row execute function public.validate_timezone();

-- Tienda: fecha mínima de entrega según la hora local de la repostería
create or replace function public.place_store_order(
  p_slug text, p_name text, p_phone text, p_email text, p_delivery_date date, p_delivery_time text,
  p_delivery_type text, p_address text, p_notes text, p_items jsonb
) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid; v_profile public.profiles; v_client uuid; v_order uuid; v_folio int;
  v_sub numeric := 0; v_ship numeric := 0; v_today date; it jsonb; d public.desserts; q numeric; v_pos int := 0;
begin
  perform public.enforce_rate_limit('store_order:' || public.request_ip(), 6, interval '10 minutes');
  select * into v_profile from public.profiles where store_slug = lower(p_slug) and store_enabled;
  if not found then raise exception 'Tienda no disponible'; end if;
  v_owner := v_profile.id;
  -- Las fechas se validan con la zona horaria de la repostería (no la del servidor)
  v_today := (now() at time zone coalesce(v_profile.timezone, 'America/Mexico_City'))::date;
  if coalesce(trim(p_name),'') = '' or coalesce(trim(p_phone),'') = '' then raise exception 'Nombre y teléfono son obligatorios'; end if;
  if length(regexp_replace(p_phone, '\D', '', 'g')) not between 8 and 15 then raise exception 'Teléfono inválido'; end if;
  if coalesce(p_email,'') <> '' and p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Correo inválido'; end if;
  if p_delivery_date is not null and p_delivery_date > v_today + 365 then raise exception 'Fecha de entrega inválida'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'Carrito inválido';
  end if;
  if p_delivery_date is not null and p_delivery_date < v_today + v_profile.store_min_notice_days then
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

-- Aceptar cotización: la vigencia se compara con la fecha local de la repostería
create or replace function public.accept_public_quote(p_token uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  perform public.enforce_rate_limit('quote_accept:' || public.request_ip(), 10, interval '10 minutes');
  update public.quotes q set status = 'aceptada', accepted_at = now()
   where q.public_token = p_token and q.share_enabled and q.status in ('borrador','enviada')
     and (q.valid_until is null or q.valid_until >= (
           select (now() at time zone coalesce(p.timezone, 'America/Mexico_City'))::date
             from public.profiles p where p.id = q.user_id));
  return found;
end $$;

grant execute on function public.accept_public_quote(uuid) to anon, authenticated;
grant execute on function public.place_store_order(text,text,text,text,date,text,text,text,text,jsonb) to anon, authenticated;

notify pgrst, 'reload schema';
