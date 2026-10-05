-- =====================================================================
--  0006 · Minitienda personalizable (colores, tipografía, acomodo, secciones)
--  Ejecutar después de 0005 (se puede ejecutar más de una vez).
-- =====================================================================
alter table public.profiles add column if not exists store_theme jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists store_about text;
alter table public.profiles add column if not exists store_hours text;
alter table public.profiles add column if not exists store_announcement text;
alter table public.desserts add column if not exists store_featured boolean not null default false;
alter table public.desserts add column if not exists store_position int not null default 0;

do $$ begin
  alter table public.profiles add constraint profiles_store_theme_valid
    check (jsonb_typeof(store_theme) = 'object' and pg_column_size(store_theme) < 4000) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.profiles add constraint profiles_store_about_len check (char_length(store_about) <= 2000) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.profiles add constraint profiles_store_hours_len check (char_length(store_hours) <= 600) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.profiles add constraint profiles_store_announcement_len check (char_length(store_announcement) <= 160) not valid;
exception when duplicate_object then null; end $$;

create or replace function public.get_store(p_slug text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'store', json_build_object('slug', p.store_slug, 'title', coalesce(p.store_title, p.business_name),
             'business_name', p.business_name, 'description', p.store_description, 'banner_url', p.store_banner_url,
             'logo_url', p.logo_url, 'whatsapp', p.whatsapp, 'instagram', p.instagram, 'facebook', p.facebook, 'address', p.address,
             'min_notice_days', p.store_min_notice_days, 'delivery', p.store_delivery, 'pickup', p.store_pickup,
             'shipping_fee', p.store_shipping_fee, 'theme', p.store_theme, 'about', p.store_about,
             'hours', p.store_hours, 'announcement', p.store_announcement),
    'products', coalesce((select json_agg(json_build_object('id', d.id, 'name', d.name, 'category', d.category,
                  'description', d.description, 'image_url', d.image_url, 'unit_label', d.unit_label,
                  'price', d.sale_price, 'featured', d.store_featured) order by d.store_position, d.category, d.name)
                  from public.desserts d
                 where d.user_id = p.id and d.store_visible and d.active and d.sale_price is not null), '[]'::json)
  )
  from public.profiles p where p.store_slug = lower(p_slug) and p.store_enabled;
$$;

grant execute on function public.get_store(text) to anon, authenticated;
notify pgrst, 'reload schema';
