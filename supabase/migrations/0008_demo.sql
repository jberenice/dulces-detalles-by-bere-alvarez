-- =====================================================================
--  0008 · Cuenta demo de prueba (48 horas, datos de ejemplo, sin licencia)
--  Requiere activar en Supabase: Authentication → Sign In / Providers → "Allow anonymous sign-ins".
--  Ejecutar después de 0007 (se puede ejecutar más de una vez).
-- =====================================================================
alter table public.profiles add column if not exists is_demo boolean not null default false;
alter table public.profiles add column if not exists demo_expires_at timestamptz;

-- El rol demo no lo puede asignar ni quitar la propia usuaria
create or replace function public.protect_profile_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() and coalesce(current_setting('dd.demo_seed', true), '') <> 'on' then
    new.role := old.role;
    new.is_demo := old.is_demo;
    new.demo_expires_at := old.demo_expires_at;
  end if;
  return new;
end $$;

-- Licencia: las cuentas demo vigentes entran sin licencia (y sin límite de dispositivo)
create or replace function public.license_status(p_session uuid) returns text
language plpgsql security definer set search_path = public as $$
declare l public.licenses; v_demo boolean; v_exp timestamptz;
begin
  if auth.uid() is null then return 'no_auth'; end if;
  if public.is_admin() then return 'ok'; end if;
  select is_demo, demo_expires_at into v_demo, v_exp from public.profiles where id = auth.uid();
  if coalesce(v_demo, false) then
    if v_exp is not null and v_exp < now() then return 'demo_expired'; end if;
    return 'ok';
  end if;
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

-- Pedido de ejemplo (uso interno del seed demo)
create or replace function public.demo_add_order(p_uid uuid, p_client uuid, p_date date, p_time text, p_status text,
                                                 p_pay text, p_source text, p_type text, p_items jsonb, p_notes text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_order uuid; it jsonb; d public.desserts; v_sub numeric := 0; v_pos int := 0; v_ship numeric := 0; c public.clients;
begin
  select * into c from public.clients where id = p_client;
  if p_type = 'envio' then v_ship := 80; end if;
  insert into public.orders (user_id, client_id, source, status, delivery_date, delivery_time, delivery_type, delivery_address,
                             customer_name, customer_phone, notes, shipping, payment_status, payment_method)
  values (p_uid, p_client, p_source, p_status, p_date, p_time, p_type, case when p_type = 'envio' then c.address end,
          c.name, c.phone, p_notes, v_ship, p_pay, case when p_pay <> 'pendiente' then 'Transferencia' end)
  returning id into v_order;
  for it in select * from jsonb_array_elements(p_items) loop
    select * into d from public.desserts where user_id = p_uid and name = it->>'name' limit 1;
    continue when not found;
    insert into public.order_items (user_id, order_id, dessert_id, description, quantity, unit_price, unit_cost, position)
    values (p_uid, v_order, d.id, d.name, (it->>'qty')::numeric, d.sale_price, round(d.sale_price * 0.55, 2), v_pos);
    v_sub := v_sub + (it->>'qty')::numeric * d.sale_price;
    v_pos := v_pos + 1;
  end loop;
  update public.orders
     set subtotal = v_sub, total = v_sub + v_ship,
         deposit = case p_pay when 'pagado' then v_sub + v_ship when 'anticipo' then round((v_sub + v_ship) / 2, 0) else 0 end
   where id = v_order;
  return v_order;
end $$;

-- Clientes, pedidos, cotizaciones e inventario de ejemplo
create or replace function public.seed_demo_extras(p_uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  t date := (now() at time zone 'America/Mexico_City')::date;
  c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid; q uuid; o uuid;
begin
  insert into public.clients (user_id, name, phone, email, address, birthday, notes) values
    (p_uid, 'Laura Méndez', '9981234567', 'laura@ejemplo.com', 'Av. Tulum 120, Cancún', t + 12, 'Le encantan los cupcakes red velvet')
    returning id into c1;
  insert into public.clients (user_id, name, phone, email, address) values (p_uid, 'Sofía Herrera', '9831112233', 'sofia@ejemplo.com', 'Calle Héroes 45, Chetumal') returning id into c2;
  insert into public.clients (user_id, name, phone, address, notes) values (p_uid, 'Café La Esquina', '9982223344', 'Blvd. Kukulcán km 9', 'Pedido semanal para cafetería') returning id into c3;
  insert into public.clients (user_id, name, phone, email) values (p_uid, 'Mariana Cruz', '9984445566', 'mariana@ejemplo.com') returning id into c4;
  insert into public.clients (user_id, name, phone, notes) values (p_uid, 'Jorge Ramírez', '9835556677', 'Alérgico a la nuez') returning id into c5;

  -- Ventas pasadas (para reportes)
  perform public.demo_add_order(p_uid, c3, t - 20, '09:00', 'entregado', 'pagado', 'manual', 'envio', '[{"name":"Brownies","qty":2},{"name":"Pan de plátano","qty":2}]');
  perform public.demo_add_order(p_uid, c1, t - 16, '17:00', 'entregado', 'pagado', 'tienda', 'recoger', '[{"name":"Red Velvet","qty":12}]');
  perform public.demo_add_order(p_uid, c2, t - 13, '13:00', 'entregado', 'pagado', 'cotizacion', 'envio', '[{"name":"Pastel 3 leches","qty":1},{"name":"Vainilla","qty":12}]');
  perform public.demo_add_order(p_uid, c3, t - 13, '09:00', 'entregado', 'pagado', 'manual', 'envio', '[{"name":"Brownies","qty":2},{"name":"Cheesecake","qty":1}]');
  perform public.demo_add_order(p_uid, c4, t - 9, '18:00', 'entregado', 'pagado', 'tienda', 'recoger', '[{"name":"Nutella","qty":6},{"name":"Chocolate","qty":6}]');
  perform public.demo_add_order(p_uid, c3, t - 6, '09:00', 'entregado', 'pagado', 'manual', 'envio', '[{"name":"Brownies","qty":3},{"name":"Pay de limón","qty":1}]');
  perform public.demo_add_order(p_uid, c5, t - 3, '16:00', 'entregado', 'pagado', 'manual', 'recoger', '[{"name":"Pastel chocolate","qty":1}]', 'Sin nuez, por favor');

  -- Próximas entregas
  perform public.demo_add_order(p_uid, c1, t, '17:00', 'listo', 'anticipo', 'tienda', 'recoger', '[{"name":"Red Velvet","qty":6},{"name":"Fresa y Nata","qty":6}]');
  perform public.demo_add_order(p_uid, c3, t + 1, '09:00', 'en_preparacion', 'pendiente', 'manual', 'envio', '[{"name":"Brownies","qty":3},{"name":"Pan de plátano","qty":2}]');
  o := public.demo_add_order(p_uid, c2, t + 3, '13:00', 'confirmado', 'anticipo', 'cotizacion', 'envio',
        '[{"name":"Pastel 3 leches con fresas","qty":1},{"name":"Vainilla","qty":24},{"name":"Chocolate","qty":24}]', 'XV años de Sofía · colores rosa y dorado');
  perform public.demo_add_order(p_uid, c4, t + 5, '18:30', 'pendiente', 'pendiente', 'tienda', 'recoger', '[{"name":"Cheesecake","qty":1}]');

  -- Cotizaciones
  insert into public.quotes (user_id, client_id, status, title, event_date, valid_until, notes, terms, subtotal, total)
  values (p_uid, c4, 'enviada', 'Baby shower', t + 18, t + 10, 'Decoración en tonos menta', 'Anticipo del 50% para apartar la fecha.', 0, 0)
  returning id into q;
  insert into public.quote_items (user_id, quote_id, dessert_id, description, quantity, unit_price, unit_cost, position)
  select p_uid, q, d.id, d.name, x.qty, d.sale_price, round(d.sale_price * 0.55, 2), x.pos
    from (values ('Pastel zanahoria', 1, 0), ('Margarita', 24, 1), ('Brownies', 2, 2)) as x(name, qty, pos)
    join public.desserts d on d.user_id = p_uid and d.name = x.name;
  update public.quotes set subtotal = s.v, total = s.v
    from (select sum(total) v from public.quote_items where quote_id = q) s where id = q;

  insert into public.quotes (user_id, client_id, status, title, event_date, valid_until, subtotal, total)
  values (p_uid, c5, 'borrador', 'Cumpleaños de oficina', t + 25, t + 15, 0, 0) returning id into q;
  insert into public.quote_items (user_id, quote_id, dessert_id, description, quantity, unit_price, unit_cost, position)
  select p_uid, q, d.id, d.name, x.qty, d.sale_price, round(d.sale_price * 0.55, 2), x.pos
    from (values ('Pastel moka', 1, 0), ('Café de olla', 12, 1)) as x(name, qty, pos)
    join public.desserts d on d.user_id = p_uid and d.name = x.name;
  update public.quotes set subtotal = s.v, total = s.v
    from (select sum(total) v from public.quote_items where quote_id = q) s where id = q;

  -- Inventario con algunas existencias (y un par en stock bajo para ver el aviso)
  update public.ingredients set stock = package_qty * 2, min_stock = package_qty * 0.5 where user_id = p_uid and kind = 'ingrediente';
  update public.ingredients set stock = package_qty * 0.3 where user_id = p_uid and name in ('Harina', 'Huevos', 'Margarina');
  update public.ingredients set stock = package_qty where user_id = p_uid and kind = 'empaque';

  -- Destacados de la tienda demo
  update public.desserts set store_featured = true where user_id = p_uid and name in ('Red Velvet', 'Pastel 3 leches', 'Cheesecake', 'Brownies');
end $$;

-- Inicia la demo para la sesión anónima actual
create or replace function public.start_demo() returns json
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_anon boolean;
begin
  if v_uid is null then raise exception 'Sesión no válida' using errcode = '42501'; end if;
  v_anon := coalesce((nullif(current_setting('request.jwt.claims', true), '')::json ->> 'is_anonymous')::boolean, false);
  if not v_anon then raise exception 'La demo solo está disponible para invitadas' using errcode = '42501'; end if;
  if exists (select 1 from public.profiles where id = v_uid and is_demo) then
    return json_build_object('ok', true, 'already', true);
  end if;
  perform public.enforce_rate_limit('demo:' || public.request_ip(), 5, interval '1 hour');

  perform set_config('dd.demo_seed', 'on', true);
  update public.profiles
     set is_demo = true,
         demo_expires_at = now() + interval '48 hours',
         business_name = 'Repostería Demo',
         owner_name = 'Invitada',
         store_slug = 'demo-' || substr(replace(v_uid::text, '-', ''), 1, 10),
         store_enabled = true,
         store_title = 'Dulces de Prueba',
         store_description = 'Así se verá tu tienda en línea. ¡Agrega postres al carrito para probar!',
         store_announcement = '🎉 Tienda de demostración · los pedidos no son reales',
         store_about = 'Somos una repostería casera que hornea con amor desde 2018. Esta es una tienda de ejemplo para que veas todo lo que puedes hacer.',
         store_hours = 'Lunes a sábado de 9:00 a 19:00',
         inventory_enabled = true,
         bank_info = 'Banco Ejemplo · CLABE 000 000 0000 0000 00'
   where id = v_uid;
  perform set_config('dd.demo_seed', '', true);

  perform public.seed_starter_data(v_uid);
  perform public.seed_demo_extras(v_uid);
  return json_build_object('ok', true);
end $$;

-- Lista de cuentas demo vencidas (la usa el cron para borrarlas)
create or replace function public.demo_expired_users(p_limit int default 200) returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from public.profiles where is_demo and demo_expires_at < now() - interval '1 hour' limit p_limit;
$$;

revoke execute on function public.demo_add_order(uuid, uuid, date, text, text, text, text, text, jsonb, text) from public, anon, authenticated;
revoke execute on function public.seed_demo_extras(uuid) from public, anon, authenticated;
revoke execute on function public.demo_expired_users(int) from public, anon, authenticated;
grant execute on function public.start_demo() to authenticated;
grant execute on function public.demo_expired_users(int) to service_role;

-- Las cuentas demo no pueden subir archivos al almacenamiento
drop policy if exists "media owner insert" on storage.objects;
create policy "media owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text
              and not exists (select 1 from public.profiles where id = auth.uid() and is_demo));

notify pgrst, 'reload schema';
