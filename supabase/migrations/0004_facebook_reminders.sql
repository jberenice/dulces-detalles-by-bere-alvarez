-- =====================================================================
--  0004 · Facebook, recordatorios de entrega y consentimiento legal
--  Ejecutar después de 0003 (se puede ejecutar más de una vez).
-- =====================================================================
alter table public.profiles add column if not exists facebook text;
alter table public.profiles add column if not exists reminder_email boolean not null default true;
alter table public.profiles add column if not exists reminder_days_before int not null default 1 check (reminder_days_before between 0 and 7);
alter table public.profiles add column if not exists terms_accepted_at timestamptz;

do $$ begin
  alter table public.profiles add constraint profiles_facebook_len check (char_length(facebook) <= 300) not valid;
exception when duplicate_object then null; end $$;

-- Guarda la aceptación de términos y aviso de privacidad hecha en el registro
create or replace function public.handle_terms_acceptance() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce((new.raw_user_meta_data->>'terms_accepted')::boolean, false) then
    update public.profiles set terms_accepted_at = now() where id = new.id;
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_terms on auth.users;
create trigger on_auth_user_terms after insert on auth.users
  for each row execute function public.handle_terms_acceptance();

create or replace function public.get_store(p_slug text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'store', json_build_object('slug', p.store_slug, 'title', coalesce(p.store_title, p.business_name),
             'business_name', p.business_name, 'description', p.store_description, 'banner_url', p.store_banner_url,
             'logo_url', p.logo_url, 'whatsapp', p.whatsapp, 'instagram', p.instagram, 'facebook', p.facebook, 'address', p.address,
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
                   'logo_url', p.logo_url, 'instagram', p.instagram, 'facebook', p.facebook, 'bank_info', p.bank_info,
                   'store_slug', case when p.store_enabled then p.store_slug end)
                 from public.profiles p where p.id = q.user_id)
  )
  from public.quotes q where q.public_token = p_token and q.share_enabled;
$$;

grant execute on function public.get_store(text) to anon, authenticated;
grant execute on function public.get_public_quote(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
