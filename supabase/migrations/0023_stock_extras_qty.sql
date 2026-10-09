-- Cantidades de empaques por paquete, extras ligados al inventario y aviso de falta de stock
--   · Cada empaque de un paquete lleva cantidad (ej. 3 vasos); se cobra, cuenta en el costo y descuenta inventario × cantidad
--   · Los extras se pueden ligar a un artículo de Inventario (listón por metro, etc.): la tienda muestra lo que queda
--     y no deja pedir más; al entregar el pedido se descuenta
--   · Si un pedido necesita más stock del que hay, se guarda el faltante (orders.stock_shortage) y se avisa por push
-- Es seguro correrla más de una vez. Ejecutar después de 0022.

alter table public.packages add column if not exists packaging_qty jsonb not null default '{}'::jsonb;
do $$ begin
  alter table public.packages add constraint packages_packaging_qty_valid check (jsonb_typeof(packaging_qty) = 'object' and pg_column_size(packaging_qty) < 2000) not valid;
exception when duplicate_object then null; end $$;

alter table public.extras add column if not exists ingredient_id uuid references public.ingredients on delete set null;
alter table public.extras add column if not exists ingredient_qty numeric(10,3) not null default 1;
alter table public.extras add column if not exists unit_label text not null default 'pieza';
do $$ begin
  alter table public.extras add constraint extras_ingredient_qty_valid check (ingredient_qty > 0 and ingredient_qty <= 10000) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.extras add constraint extras_unit_label_valid check (char_length(unit_label) between 1 and 20) not valid;
exception when duplicate_object then null; end $$;

alter table public.order_items add column if not exists extra_id uuid references public.extras on delete set null;
alter table public.orders add column if not exists stock_shortage jsonb;

create or replace function public.check_extra_ingredient() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.ingredient_id is not null and not exists (select 1 from public.ingredients where id = new.ingredient_id and user_id = new.user_id) then
    raise exception 'Referencia a un registro de otra cuenta' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists trg_check_extra_ingredient on public.extras;
create trigger trg_check_extra_ingredient before insert or update on public.extras for each row execute function public.check_extra_ingredient();

-- Validación de empaques y sus cantidades
create or replace function public.check_package_packaging() returns trigger
language plpgsql security definer set search_path = public as $$
declare k text; v numeric;
begin
  new.packaging_ids := coalesce((select array_agg(distinct x) from unnest(new.packaging_ids) x where x is not null and x is distinct from new.packaging_id), '{}'::uuid[]);
  if exists (select 1 from unnest(new.packaging_ids) pid where not exists (select 1 from public.ingredients i where i.id = pid and i.user_id = new.user_id)) then
    raise exception 'Referencia a un registro de otra cuenta' using errcode = '42501';
  end if;
  if jsonb_typeof(new.packaging_qty) is distinct from 'object' then new.packaging_qty := '{}'::jsonb; end if;
  for k in select jsonb_object_keys(new.packaging_qty) loop
    if k !~ '^[0-9a-fA-F-]{36}$' or jsonb_typeof(new.packaging_qty->k) <> 'number' then
      raise exception 'Cantidad de empaque no válida';
    end if;
    v := (new.packaging_qty->>k)::numeric;
    if v <= 0 or v > 1000 then raise exception 'Cantidad de empaque no válida (de 0 a 1000)'; end if;
  end loop;
  return new;
end $$;

-- Precio de los empaques que se le cobran a la clienta: Σ costo × cantidad
create or replace function public.package_box_price(k public.packages) returns numeric
language sql stable set search_path = public as $$
  select coalesce((select sum(round(i.unit_cost::numeric * coalesce(nullif(k.packaging_qty->>(i.id::text), '')::numeric, 1), 2))
                     from public.ingredients i
                    where i.user_id = k.user_id
                      and (i.id = k.packaging_id or i.id = any(coalesce(k.packaging_ids, '{}'::uuid[])))), 0);
$$;
revoke execute on function public.package_box_price(public.packages) from public, anon, authenticated;

-- Inventario: empaques × cantidad y materiales de los extras al entregar el pedido
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
      select pk.pid, sum(oi.quantity * coalesce(nullif(p.packaging_qty->>(pk.pid::text), '')::numeric, 1))
        from public.order_items oi
        join public.packages p on p.id = oi.package_id and p.user_id = new.user_id
        cross join lateral unnest(array_remove(array[p.packaging_id] || coalesce(p.packaging_ids, '{}'::uuid[]), null)) as pk(pid)
       where oi.order_id = new.id and oi.user_id = new.user_id
       group by pk.pid
      union all
      select x.ingredient_id, sum(oi.quantity * x.ingredient_qty)
        from public.order_items oi
        join public.extras x on x.id = oi.extra_id and x.user_id = new.user_id
       where oi.order_id = new.id and oi.user_id = new.user_id and x.ingredient_id is not null
       group by x.ingredient_id
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

-- Faltantes de stock de un pedido (empaques de las cajas y materiales de los extras)
create or replace function public.order_stock_shortage(p_order uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  with o as (select id, user_id from public.orders where id = p_order),
  need as (
    select pk.pid as ing, sum(oi.quantity * coalesce(nullif(p.packaging_qty->>(pk.pid::text), '')::numeric, 1)) as qty
      from o join public.order_items oi on oi.order_id = o.id
      join public.packages p on p.id = oi.package_id
      cross join lateral unnest(array_remove(array[p.packaging_id] || coalesce(p.packaging_ids, '{}'::uuid[]), null)) as pk(pid)
     group by pk.pid
    union all
    select x.ingredient_id, sum(oi.quantity * x.ingredient_qty)
      from o join public.order_items oi on oi.order_id = o.id
      join public.extras x on x.id = oi.extra_id
     where x.ingredient_id is not null
     group by x.ingredient_id
  ), tot as (
    select ing, sum(qty) as qty from need group by ing
  )
  select coalesce(jsonb_agg(jsonb_build_object('name', i.name, 'unit', i.unit, 'need', round(t.qty, 2), 'have', round(i.stock, 2)) order by i.name), '[]'::jsonb)
    from tot t join o on true join public.ingredients i on i.id = t.ing and i.user_id = o.user_id
   where i.stock < t.qty;
$$;
revoke execute on function public.order_stock_shortage(uuid) from public, anon, authenticated;

-- Tienda: extras con unidad y existencias
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
                  'image_url', x.image_url, 'price', x.price, 'unit_label', x.unit_label,
                  'stock_left', case when p.inventory_enabled and x.ingredient_id is not null
                                     then (select floor(greatest(i.stock, 0) / x.ingredient_qty) from public.ingredients i where i.id = x.ingredient_id and i.user_id = p.id)
                                     else null end) order by x.position, x.name)
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

-- Pedido de la tienda: valida existencias de los extras y avisa faltantes
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
  pk public.packages; v_token uuid; v_comp jsonb; v_disc numeric := 0; v_code text; cq record; ex public.extras; v_box numeric; v_extras int := 0; v_sur numeric := 0; v_xcost numeric; v_xleft numeric;
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
      v_xcost := ex.cost;
      if ex.ingredient_id is not null then
        select round(i.unit_cost::numeric * ex.ingredient_qty, 2), floor(greatest(i.stock, 0) / ex.ingredient_qty)
          into v_xcost, v_xleft from public.ingredients i where i.id = ex.ingredient_id and i.user_id = v_owner;
        v_xcost := coalesce(v_xcost, ex.cost);
        if coalesce(v_profile.inventory_enabled, false) and v_xleft is not null and q > v_xleft then
          if v_xleft <= 0 then raise exception 'Ya no tenemos % disponible', ex.name; end if;
          raise exception 'De % solo quedan % %', ex.name, v_xleft::int, ex.unit_label;
        end if;
      end if;
      insert into public.order_items (user_id, order_id, dessert_id, description, quantity, unit_price, unit_cost, position, extra_id)
      values (v_owner, v_order, null, left('Extra: ' || ex.name || case when ex.unit_label <> 'pieza' then ' (' || ex.unit_label || ')' else '' end, 300), q, ex.price, v_xcost, v_pos, ex.id);
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
  -- Aviso al dueño si no alcanza el stock de empaques o extras de este pedido
  if coalesce(v_profile.inventory_enabled, false) then
    update public.orders set stock_shortage = public.order_stock_shortage(v_order) where id = v_order;
  end if;

  return json_build_object('order_id', v_order, 'folio', v_folio, 'token', v_token, 'subtotal', v_sub, 'discount', v_disc, 'coupon', v_code,
                           'shipping', v_ship, 'total', v_sub - v_disc + v_ship, 'whatsapp', v_profile.whatsapp,
                           'business_name', v_profile.business_name, 'zone', v_zone);
end $$;

notify pgrst, 'reload schema';
