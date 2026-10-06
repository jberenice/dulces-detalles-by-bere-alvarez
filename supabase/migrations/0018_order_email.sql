-- =====================================================================
--  0018 · Copia del pedido por correo para la clienta
--   · La tienda regresa el token secreto del pedido (para descargar su PDF en /p/<token>)
--   · Se registra cuándo se le envió la copia por correo (solo se envía una vez)
--  Ejecutar después de 0017 (se puede ejecutar más de una vez).
-- =====================================================================

alter table public.orders add column if not exists customer_email_sent_at timestamptz;

create or replace function public.place_store_order(
  p_slug text, p_name text, p_phone text, p_email text, p_delivery_date date, p_delivery_time text,
  p_delivery_type text, p_address text, p_notes text, p_items jsonb, p_zone text, p_coupon text
) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid; v_profile public.profiles; v_client uuid; v_order uuid; v_folio int;
  v_sub numeric := 0; v_ship numeric := 0; v_today date; it jsonb; d public.desserts; q numeric; v_pos int := 0;
  v_notice int; v_zone text; z jsonb; g jsonb; opt jsonb; chosen text; v_price numeric; v_desc text; v_count int;
  pk public.packages; v_token uuid; v_comp jsonb; v_disc numeric := 0; v_code text; cq record; ex public.extras; v_box numeric; v_extras int := 0;
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
  returning id, folio, public_token into v_order, v_folio, v_token;

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
      -- La caja o empaque se le cobra a la clienta (va incluida en el precio de la tienda)
      v_box := public.package_box_price(pk);
      insert into public.order_items (user_id, order_id, dessert_id, package_id, components, description, quantity, unit_price, position)
      values (v_owner, v_order, null, pk.id, v_comp, left(v_desc, 300), q, pk.price + v_box, v_pos);
      v_pos := v_pos + 1;
      v_sub := v_sub + q * (pk.price + v_box);
      continue;
    end if;

    -- Extras (listón, moño, tarjeta…): precio del catálogo, nunca el que mande el navegador
    if it ? 'extra_id' then
      select x.* into ex from public.extras x
       where x.id = (it->>'extra_id')::uuid and x.user_id = v_owner and x.available;
      continue when not found;
      q := least(q, 100);
      insert into public.order_items (user_id, order_id, dessert_id, description, quantity, unit_price, unit_cost, position)
      values (v_owner, v_order, null, left('Extra: ' || ex.name, 300), q, ex.price, ex.cost, v_pos);
      v_pos := v_pos + 1;
      v_extras := v_extras + 1;
      v_sub := v_sub + q * ex.price;
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

  if v_pos - v_extras = 0 then raise exception 'Ningún producto válido en el carrito'; end if;
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

  return json_build_object('order_id', v_order, 'folio', v_folio, 'token', v_token, 'subtotal', v_sub, 'discount', v_disc, 'coupon', v_code,
                           'shipping', v_ship, 'total', v_sub - v_disc + v_ship, 'whatsapp', v_profile.whatsapp,
                           'business_name', v_profile.business_name, 'zone', v_zone);
end $$;

grant execute on function public.place_store_order(text,text,text,text,date,text,text,text,text,jsonb,text,text) to anon, authenticated;

notify pgrst, 'reload schema';
