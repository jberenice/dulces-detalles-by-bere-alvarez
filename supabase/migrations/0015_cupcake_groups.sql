-- =====================================================================
--  0015 · Categorías de cupcakes y tipos de paquete
--   · Categorías de cupcakes (ej. Clásicos, Mexicanos sin alcohol, Mexicanos con alcohol)
--   · Paquetes: cajas de cupcakes (por categorías), pastel mini con cupcakes y paquetes de postres
--  Ejecutar después de 0014 (se puede ejecutar más de una vez).
-- =====================================================================

create table if not exists public.flavor_groups (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null check (char_length(name) between 1 and 60),
  position   int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_flavor_groups_user on public.flavor_groups(user_id, position);
alter table public.flavor_groups enable row level security;
drop policy if exists "owner all" on public.flavor_groups;
create policy "owner all" on public.flavor_groups for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "anon needs demo" on public.flavor_groups;
create policy "anon needs demo" on public.flavor_groups as restrictive for all to authenticated
  using (not public.is_anonymous() or exists (select 1 from public.profiles where id = auth.uid() and is_demo))
  with check (not public.is_anonymous() or exists (select 1 from public.profiles where id = auth.uid() and is_demo));
drop trigger if exists trg_lock_owner on public.flavor_groups;
create trigger trg_lock_owner before update on public.flavor_groups for each row execute function public.lock_owner();

alter table public.desserts add column if not exists flavor_group_id uuid references public.flavor_groups on delete set null;

-- Tipo de paquete (las cajas que ya existían se clasifican solas)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'packages' and column_name = 'kind') then
    alter table public.packages add column kind text not null default 'postres';
    update public.packages set kind = case when mode = 'surtido' then 'cupcakes' else 'postres' end;
  end if;
end $$;
do $$ begin
  alter table public.packages add constraint packages_kind_valid check (kind in ('cupcakes','pastel','postres'));
exception when duplicate_object then null; end $$;
alter table public.packages add column if not exists groups uuid[] not null default '{}';
alter table public.packages add column if not exists cake_items jsonb not null default '[]'::jsonb;
alter table public.packages add column if not exists cakes int not null default 1;
do $$ begin
  alter table public.packages add constraint packages_extra_valid
    check (cardinality(groups) <= 20 and jsonb_typeof(cake_items) = 'array' and pg_column_size(cake_items) < 4000 and cakes between 1 and 10) not valid;
exception when duplicate_object then null; end $$;

-- Validación del paquete: todo debe ser de la misma cuenta; el tipo define cómo se arma
create or replace function public.check_package() returns trigger
language plpgsql security definer set search_path = public as $$
declare bad int;
begin
  new.mode := case when new.kind = 'postres' then 'fijo' else 'surtido' end;
  if new.packaging_id is not null and not exists (select 1 from public.ingredients where id = new.packaging_id and user_id = new.user_id) then
    raise exception 'Referencia a un registro de otra cuenta' using errcode = '42501';
  end if;
  if jsonb_array_length(new.items) > 60 or jsonb_array_length(new.cake_items) > 40 then raise exception 'Demasiados postres en el paquete'; end if;
  select count(*) into bad from (select e from jsonb_array_elements(new.items) e union all select e from jsonb_array_elements(new.cake_items) e) x(e)
   where coalesce(e->>'dessert_id', '') !~ '^[0-9a-fA-F-]{36}$'
      or not exists (select 1 from public.desserts d where d.id = (e->>'dessert_id')::uuid and d.user_id = new.user_id);
  if bad > 0 then raise exception 'Revisa los postres del paquete' using errcode = '42501'; end if;
  if new.mode = 'fijo' and exists (select 1 from jsonb_array_elements(new.items) e where coalesce((e->>'qty')::numeric, 0) <= 0) then
    raise exception 'Revisa las cantidades del paquete';
  end if;
  if exists (select 1 from unnest(new.groups) gid where not exists (select 1 from public.flavor_groups f where f.id = gid and f.user_id = new.user_id)) then
    raise exception 'Referencia a un registro de otra cuenta' using errcode = '42501';
  end if;
  return new;
end $$;

-- La categoría del postre debe ser de la misma cuenta
create or replace function public.check_growth_refs() returns trigger
language plpgsql security definer set search_path = public as $$
declare ok boolean := true;
begin
  if tg_table_name in ('desserts','packages','coupons') then
    ok := new.season_id is null or exists (select 1 from public.seasons where id = new.season_id and user_id = new.user_id);
    if ok and tg_table_name = 'desserts' then
      ok := new.flavor_group_id is null or exists (select 1 from public.flavor_groups where id = new.flavor_group_id and user_id = new.user_id);
    end if;
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

-- Cupcakes que se pueden elegir: los de sus categorías (o los que se eligieron uno por uno, en cajas anteriores)
create or replace function public.package_flavor_ids(k public.packages) returns setof uuid
language sql stable set search_path = public as $$
  select d.id from public.desserts d
   where d.user_id = k.user_id and d.active and k.mode = 'surtido'
     and case when cardinality(k.groups) > 0 then d.flavor_group_id = any(k.groups)
              else d.id in (select (e->>'dessert_id')::uuid from jsonb_array_elements(k.items) e
                             where coalesce(e->>'dessert_id', '') ~ '^[0-9a-fA-F-]{36}$') end;
$$;
-- Sabores de pastel mini que se pueden elegir
create or replace function public.package_cake_ids(k public.packages) returns setof uuid
language sql stable set search_path = public as $$
  select d.id from public.desserts d
   where d.user_id = k.user_id and d.active and k.kind = 'pastel'
     and d.id in (select (e->>'dessert_id')::uuid from jsonb_array_elements(k.cake_items) e
                   where coalesce(e->>'dessert_id', '') ~ '^[0-9a-fA-F-]{36}$');
$$;
revoke execute on function public.package_flavor_ids(public.packages) from public, anon, authenticated;
revoke execute on function public.package_cake_ids(public.packages) from public, anon, authenticated;

-- Contenido de una caja (validado). Regresa [{dessert_id, name, qty}] con el pastel primero.
create or replace function public.package_components(p_pkg public.packages, p_choices jsonb) returns jsonb
language plpgsql stable set search_path = public as $$
declare v jsonb; v_cups int; v_cakes int; v_bad int;
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

  with s as (
    select (c->>'dessert_id')::uuid as id, sum((c->>'qty')::int) as qty
      from jsonb_array_elements(p_choices) c where (c->>'qty')::int > 0 group by 1
  ), t as (
    select s.id, s.qty,
           (s.id in (select public.package_cake_ids(p_pkg))) as is_cake,
           (s.id in (select public.package_flavor_ids(p_pkg))) as is_cup
      from s
  )
  select count(*) filter (where not is_cake and not is_cup),
         coalesce(sum(qty) filter (where is_cake), 0),
         coalesce(sum(qty) filter (where not is_cake and is_cup), 0)
    into v_bad, v_cakes, v_cups
    from t;
  if v_bad > 0 then raise exception 'Ese sabor no está disponible en %', p_pkg.name; end if;
  if p_pkg.kind = 'pastel' and v_cakes <> p_pkg.cakes then
    raise exception 'Elige % pastel% mini para %', p_pkg.cakes, case when p_pkg.cakes = 1 then '' else 'es' end, p_pkg.name;
  end if;
  if v_cups <> p_pkg.pieces then
    raise exception 'La caja % lleva % piezas (elegiste %)', p_pkg.name, p_pkg.pieces, v_cups;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('dessert_id', d.id, 'name', d.name, 'qty', s.qty)
                            order by (s.id in (select public.package_cake_ids(p_pkg))) desc, d.name), '[]'::jsonb)
    into v
    from (select (c->>'dessert_id')::uuid as id, sum((c->>'qty')::int) as qty
            from jsonb_array_elements(p_choices) c where (c->>'qty')::int > 0 group by 1) s
    join public.desserts d on d.id = s.id;
  return v;
end $$;
revoke execute on function public.package_components(public.packages, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Tienda
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
                  'image_url', k.image_url, 'mode', k.mode, 'kind', k.kind, 'pieces', k.pieces, 'cakes', k.cakes,
                  'price', k.price, 'season_id', k.season_id,
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
                                  'group', fg.name, 'price', case when d.store_visible then d.sale_price end)
                                  order by fg.position nulls last, fg.name, d.name), '[]'::json)
                         from public.desserts d left join public.flavor_groups fg on fg.id = d.flavor_group_id
                        where d.id in (select public.package_flavor_ids(k)))
                    end,
                  'cake_options', case when k.kind = 'pastel' then
                      (select coalesce(json_agg(json_build_object('dessert_id', d.id, 'name', d.name, 'image_url', d.image_url,
                                  'price', case when d.store_visible then d.sale_price end) order by d.name), '[]'::json)
                         from public.desserts d where d.id in (select public.package_cake_ids(k)))
                    else '[]'::json end)
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

-- ---------------------------------------------------------------------
-- Categorías de ejemplo para los cupcakes de ejemplo
-- ---------------------------------------------------------------------
create or replace function public.seed_cupcake_groups(p_uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare g1 uuid; g2 uuid; g3 uuid;
begin
  if exists (select 1 from public.flavor_groups where user_id = p_uid) then return; end if;
  if not exists (select 1 from public.desserts where user_id = p_uid and category = 'Cupcakes') then return; end if;
  insert into public.flavor_groups (user_id, name, position) values (p_uid, 'Clásicos', 0) returning id into g1;
  insert into public.flavor_groups (user_id, name, position) values (p_uid, 'Mexicanos sin alcohol', 1) returning id into g2;
  insert into public.flavor_groups (user_id, name, position) values (p_uid, 'Mexicanos con alcohol', 2) returning id into g3;
  update public.desserts set flavor_group_id = g1
   where user_id = p_uid and category = 'Cupcakes' and flavor_group_id is null and name in ('Vainilla','Chocolate','Nutella','Red Velvet','Fresa y Nata');
  update public.desserts set flavor_group_id = g2
   where user_id = p_uid and category = 'Cupcakes' and flavor_group_id is null and name in ('Chocolate mexicano','Churro','Café de olla','Mango chamoy');
  update public.desserts set flavor_group_id = g3
   where user_id = p_uid and category = 'Cupcakes' and flavor_group_id is null and name in ('Margarita','Paloma','Mezcal');
  -- Las cajas de ejemplo pasan a usar las categorías
  update public.packages set groups = array[g1] where user_id = p_uid and name = 'Caja de 6 cupcakes clásicos' and cardinality(groups) = 0;
  update public.packages set groups = array[g2, g3] where user_id = p_uid and name = 'Caja de 6 cupcakes mexicanos' and cardinality(groups) = 0;
end $$;
revoke execute on function public.seed_cupcake_groups(uuid) from public, anon, authenticated;

-- Cuentas nuevas: primero las cajas de ejemplo y luego sus categorías
create or replace function public.seed_starter_packages(p_uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_items jsonb; v_box uuid;
begin
  if not exists (select 1 from public.packages where user_id = p_uid) then
    select id into v_box from public.ingredients where user_id = p_uid and kind = 'empaque' and lower(name) = 'caja 6 cupcakes' limit 1;
    select jsonb_agg(jsonb_build_object('dessert_id', id) order by name) into v_items
      from public.desserts where user_id = p_uid and category = 'Cupcakes' and name in ('Vainilla', 'Chocolate', 'Nutella');
    if v_items is not null then
      insert into public.packages (user_id, name, description, kind, mode, pieces, price, price_mode, items, packaging_id, store_visible, position)
      values (p_uid, 'Caja de 6 cupcakes clásicos', 'Arma tu caja con tus sabores favoritos.', 'cupcakes', 'surtido', 6, 192, 'total', v_items, v_box, true, 0);
    end if;
    select jsonb_agg(jsonb_build_object('dessert_id', id) order by name) into v_items
      from public.desserts where user_id = p_uid and category = 'Cupcakes'
       and name in ('Margarita', 'Paloma', 'Mezcal', 'Mango chamoy', 'Café de olla', 'Churro', 'Chocolate mexicano');
    if v_items is not null then
      insert into public.packages (user_id, name, description, kind, mode, pieces, price, price_mode, items, packaging_id, store_visible, position)
      values (p_uid, 'Caja de 6 cupcakes mexicanos', 'Elige 6 de nuestros sabores mexicanos y llévatelos a $60 cada uno.', 'cupcakes', 'surtido', 6, 360, 'pieza', v_items, v_box, true, 1);
    end if;
  end if;
  perform public.seed_cupcake_groups(p_uid);
end $$;
revoke execute on function public.seed_starter_packages(uuid) from public, anon, authenticated;

do $$
declare r record;
begin
  for r in select distinct user_id from public.desserts where category = 'Cupcakes'
            and name in ('Vainilla','Chocolate','Nutella','Margarita','Paloma','Churro') loop
    perform public.seed_cupcake_groups(r.user_id);
  end loop;
end $$;

notify pgrst, 'reload schema';
