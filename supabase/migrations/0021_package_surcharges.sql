-- =====================================================================
--  0021 · Suplementos por sabor en cajas y margen bruto mínimo
--   · Cada caja define qué sabores llevan suplemento y de cuánto es por pieza
--       Precio final = precio base de la caja + Σ (piezas × suplemento del sabor)
--   · La tienda muestra el precio actualizado mientras la clienta arma su caja
--     y el servidor lo vuelve a calcular al hacer el pedido (nunca confía en el navegador)
--   · Margen bruto mínimo configurable (por defecto 35 %) para avisar en el panel
--  Ejecutar después de 0020 (se puede ejecutar más de una vez).
-- =====================================================================

alter table public.packages add column if not exists surcharges jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists min_margin_pct numeric not null default 35;
do $$ begin
  alter table public.profiles add constraint profiles_min_margin_valid check (min_margin_pct between 0 and 95);
exception when duplicate_object then null; end $$;

-- Validación: objeto { "<uuid de postre>": monto } con montos entre 0 y 100,000, de postres de la misma cuenta
create or replace function public.check_package_surcharges() returns trigger
language plpgsql security definer set search_path = public as $$
declare e record;
begin
  if new.surcharges is null then new.surcharges := '{}'::jsonb; end if;
  if jsonb_typeof(new.surcharges) <> 'object' then raise exception 'Suplementos no válidos'; end if;
  if (select count(*) from jsonb_object_keys(new.surcharges)) > 300 then raise exception 'Demasiados suplementos'; end if;
  for e in select key, value from jsonb_each(new.surcharges) loop
    if e.key !~ '^[0-9a-fA-F-]{36}$' or jsonb_typeof(e.value) <> 'number' then
      raise exception 'Suplementos no válidos';
    end if;
    if (e.value #>> '{}')::numeric not between 0 and 100000 then
      raise exception 'Suplementos no válidos';
    end if;
    if not exists (select 1 from public.desserts d where d.id = e.key::uuid and d.user_id = new.user_id) then
      raise exception 'Referencia a un registro de otra cuenta' using errcode = '42501';
    end if;
  end loop;
  return new;
end $$;
drop trigger if exists trg_check_package_surcharges on public.packages;
create trigger trg_check_package_surcharges before insert or update on public.packages for each row execute function public.check_package_surcharges();

-- Suplemento por pieza de un sabor en una caja (0 si no tiene)
create or replace function public.package_surcharge(k public.packages, p_dessert uuid) returns numeric
language sql stable set search_path = public as $$
  select case when jsonb_typeof(k.surcharges) = 'object' and jsonb_typeof(k.surcharges -> p_dessert::text) = 'number'
              then greatest(round((k.surcharges ->> p_dessert::text)::numeric, 2), 0) else 0 end;
$$;
revoke execute on function public.package_surcharge(public.packages, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Tienda: cada sabor trae su suplemento
-- ---------------------------------------------------------------------
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
             'today', p.today,
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
                  'image_url', k.image_url, 'mode', k.mode, 'kind', k.kind, 'pieces', k.pieces, 'cakes', k.cakes,
                  'price', k.price + public.package_box_price(k), 'box_price', public.package_box_price(k), 'season_id', k.season_id,
                  'extras', coalesce((select json_agg(x.id order by x.position, x.name) from public.extras x
                                       where x.user_id = p.id and x.available and x.id = any(k.extras)), '[]'::json),
                  'min_notice_days', greatest(coalesce(k.min_notice_days, 0),
                      coalesce((select max(coalesce(d.min_notice_days, 0)) from public.desserts d
                                 where d.id in (select public.package_flavor_ids(k) union select public.package_cake_ids(k))), 0)),
                  'options', case when k.mode = 'fijo' then
                      (select coalesce(json_agg(json_build_object('dessert_id', d.id, 'name', d.name, 'image_url', d.image_url,
                                  'qty', (e->>'qty')::numeric,
                                  'price', case when d.store_visible then d.sale_price end) order by o), '[]'::json)
                         from jsonb_array_elements(k.items) with ordinality as t(e, o)
                         join public.desserts d on d.id = (e->>'dessert_id')::uuid and d.user_id = p.id and d.active)
                    else
                      (select coalesce(json_agg(json_build_object('dessert_id', d.id, 'name', d.name, 'image_url', d.image_url,
                                  'group', fg.name, 'price', case when d.store_visible then d.sale_price end,
                                  'surcharge', public.package_surcharge(k, d.id))
                                  order by fg.position nulls last, fg.name, d.name), '[]'::json)
                         from public.desserts d left join public.flavor_groups fg on fg.id = d.flavor_group_id
                        where d.id in (select public.package_flavor_ids(k)))
                    end,
                  'cake_options', case when k.kind = 'pastel' then
                      (select coalesce(json_agg(json_build_object('dessert_id', d.id, 'name', d.name, 'image_url', d.image_url,
                                  'price', case when d.store_visible then d.sale_price end,
                                  'surcharge', public.package_surcharge(k, d.id)) order by d.name), '[]'::json)
                         from public.desserts d where d.id in (select public.package_cake_ids(k)))
                    else '[]'::json end)
                  order by k.position, k.name)
                  from public.packages k
                 where k.user_id = p.id and k.store_visible and k.active
                   and (k.season_id is null or k.season_id in (select id from on_seasons))), '[]'::json),
    'extras', coalesce((select json_agg(json_build_object('id', x.id, 'name', x.name, 'description', x.description,
                  'image_url', x.image_url, 'price', x.price) order by x.position, x.name)
                  from public.extras x where x.user_id = p.id and x.available), '[]'::json),
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

-- ---------------------------------------------------------------------
-- Pedido de la tienda: precio de la caja = base + caja + suplementos de los sabores elegidos
-- ---------------------------------------------------------------------
create or replace function public.place_store_order(
  p_slug text, p_name text, p_phone text, p_email text, p_delivery_date date, p_delivery_time text,
  p_delivery_type text, p_address text, p_notes text, p_items jsonb, p_zone text, p_coupon text,
  p_lat numeric, p_lng numeric
) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid; v_profile public.profiles; v_client uuid; v_order uuid; v_folio int;
  v_sub numeric := 0; v_ship numeric := 0; v_today date; it jsonb; d public.desserts; q numeric; v_pos int := 0;
  v_notice int; v_zone text; z jsonb; g jsonb; opt jsonb; chosen text; v_price numeric; v_desc text; v_count int;
  pk public.packages; v_token uuid; v_comp jsonb; v_disc numeric := 0; v_code text; cq record; ex public.extras; v_box numeric; v_extras int := 0; v_sur numeric := 0;
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

  -- Ubicación marcada en el mapa (solo para envíos y con coordenadas válidas)
  if p_delivery_type <> 'envio' or p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    p_lat := null; p_lng := null;
  end if;

  insert into public.orders (user_id, client_id, source, status, delivery_date, delivery_time, delivery_type, delivery_address,
                             delivery_zone, customer_name, customer_phone, customer_email, notes, shipping, delivery_lat, delivery_lng)
  values (v_owner, v_client, 'tienda', 'pendiente', p_delivery_date, left(p_delivery_time,40),
          case when p_delivery_type = 'envio' then 'envio' else 'recoger' end, left(p_address,300), v_zone,
          left(trim(p_name),120), left(p_phone,40), nullif(left(p_email,120),''), left(p_notes,1000), v_ship,
          round(p_lat, 6), round(p_lng, 6))
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
      -- Suplementos por sabor: se calculan aquí con los precios de la caja, nunca con lo que mande el navegador
      select coalesce(jsonb_agg(c || jsonb_build_object('surcharge', public.package_surcharge(pk, (c->>'dessert_id')::uuid)) order by o), '[]'::jsonb),
             coalesce(sum((c->>'qty')::numeric * public.package_surcharge(pk, (c->>'dessert_id')::uuid)), 0)
        into v_comp, v_sur
        from jsonb_array_elements(v_comp) with ordinality as t(c, o);
      v_desc := pk.name || ': ' || (select string_agg((c->>'qty') || ' ' || (c->>'name') ||
                  case when coalesce((c->>'surcharge')::numeric, 0) > 0
                       then ' (+$' || trim_scale(round((c->>'qty')::numeric * (c->>'surcharge')::numeric, 2))::text || ')' else '' end, ', ')
                from jsonb_array_elements(v_comp) c);
      v_notice := greatest(v_notice, coalesce(pk.min_notice_days, 0),
                           coalesce((select max(coalesce(x.min_notice_days, 0)) from jsonb_array_elements(v_comp) c
                                       join public.desserts x on x.id = (c->>'dessert_id')::uuid), 0));
      -- La caja o empaque se le cobra a la clienta (va incluida en el precio de la tienda)
      v_box := public.package_box_price(pk);
      insert into public.order_items (user_id, order_id, dessert_id, package_id, components, description, quantity, unit_price, position)
      values (v_owner, v_order, null, pk.id, v_comp, left(v_desc, 300), q, pk.price + v_box + v_sur, v_pos);
      v_pos := v_pos + 1;
      v_sub := v_sub + q * (pk.price + v_box + v_sur);
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

grant execute on function public.place_store_order(text,text,text,text,date,text,text,text,text,jsonb,text,text,numeric,numeric) to anon, authenticated;

notify pgrst, 'reload schema';
