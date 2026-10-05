-- =====================================================================
--  0009 · Endurecimiento para usuarios anónimos (demo)
--  Los anónimos usan el rol "authenticated": aquí se limita lo que pueden hacer.
-- =====================================================================

-- ¿La sesión actual es anónima?
create or replace function public.is_anonymous() returns boolean
language sql stable as $$
  select coalesce((nullif(current_setting('request.jwt.claims', true), '')::json ->> 'is_anonymous')::boolean, false);
$$;

-- Un usuario anónimo no puede activar licencias (debe crear su cuenta en /registro)
create or replace function public.activate_license(p_code text, p_seed boolean default true) returns json
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
  if v_uid is null then return json_build_object('ok', false, 'error', 'Inicia sesión primero'); end if;
  if public.is_anonymous() then return json_build_object('ok', false, 'error', 'Crea tu cuenta en Registro para activar tu licencia'); end if;
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

-- Los anónimos no suben archivos (aunque no hayan iniciado la demo)
drop policy if exists "media owner insert" on storage.objects;
create policy "media owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text
              and not public.is_anonymous()
              and not exists (select 1 from public.profiles where id = auth.uid() and is_demo));

-- Un anónimo sin demo iniciada no puede escribir datos del negocio (política restrictiva adicional)
do $$
declare t text;
begin
  foreach t in array array['fixed_costs','ingredients','desserts','dessert_items','clients','quotes','quote_items','orders','order_items','inventory_movements','push_subscriptions'] loop
    execute format('drop policy if exists "anon needs demo" on public.%I', t);
    execute format($p$create policy "anon needs demo" on public.%I as restrictive for all to authenticated
      using (not public.is_anonymous() or exists (select 1 from public.profiles where id = auth.uid() and is_demo))
      with check (not public.is_anonymous() or exists (select 1 from public.profiles where id = auth.uid() and is_demo))$p$, t);
  end loop;
end $$;

-- Limpieza: demos vencidas + anónimos que nunca iniciaron la demo (más de 6 horas)
create or replace function public.demo_expired_users(p_limit int default 200) returns setof uuid
language sql stable security definer set search_path = public as $$
  select id from public.profiles
   where (is_demo and demo_expires_at < now() - interval '1 hour')
      or (not is_demo and email is null and role = 'user' and created_at < now() - interval '6 hours'
          and not exists (select 1 from public.licenses l where l.user_id = profiles.id))
   limit p_limit;
$$;
revoke execute on function public.demo_expired_users(int) from public, anon, authenticated;
grant execute on function public.demo_expired_users(int) to service_role;

notify pgrst, 'reload schema';
