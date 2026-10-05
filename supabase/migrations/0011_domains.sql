-- =====================================================================
--  0011 · Direcciones de tienda
--   · Subdominio incluido: <tienda>.dulcesdetallesbyberealvarez.com (usa store_slug)
--   · Dominio propio de la clienta (servicio extra): lo registra la administradora
--  Ejecutar después de 0010 (se puede ejecutar más de una vez).
-- =====================================================================

-- Nombres que no puede usar una tienda porque son del sistema
create or replace function public.is_reserved_slug(p text) returns boolean
language sql immutable as $$
  select lower(coalesce(p, '')) = any (array[
    'www','app','api','admin','administracion','mail','correo','email','smtp','imap','pop','ftp','ns','ns1','ns2','dns',
    'tienda','tiendas','dashboard','panel','login','registro','demo','soporte','ayuda','help','blog','static','cdn',
    'assets','img','media','dev','staging','test','pruebas','status','docs','cuenta','pagos','legal','dulcesdetalles'
  ]);
$$;

do $$ begin
  alter table public.profiles add constraint store_slug_not_reserved
    check (store_slug is null or (not public.is_reserved_slug(store_slug) and char_length(store_slug) between 3 and 63)) not valid;
exception when duplicate_object then null; end $$;

-- Dominios propios de las clientas (los da de alta la administradora)
create table if not exists public.store_domains (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  domain     text not null unique,
  active     boolean not null default true,
  notes      text check (char_length(notes) <= 200),
  created_at timestamptz not null default now(),
  constraint store_domains_format check (domain ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$' and char_length(domain) <= 253)
);
create index if not exists idx_store_domains_user on public.store_domains(user_id);
alter table public.store_domains enable row level security;
drop policy if exists "admin all" on public.store_domains;
create policy "admin all" on public.store_domains for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "owner read" on public.store_domains;
create policy "owner read" on public.store_domains for select using (user_id = auth.uid());

-- Normaliza: minúsculas, sin "www." ni espacios
create or replace function public.normalize_store_domain() returns trigger
language plpgsql as $$
begin
  new.domain := regexp_replace(lower(trim(new.domain)), '^(https?://)?(www\.)?([^/]+).*$', '\3');
  return new;
end $$;
drop trigger if exists trg_normalize_store_domain on public.store_domains;
create trigger trg_normalize_store_domain before insert or update on public.store_domains
  for each row execute function public.normalize_store_domain();

-- Público: ¿qué tienda abre este dominio? (lo usa el middleware; solo tiendas publicadas y con plan Profesional o Premium)
create or replace function public.store_slug_for_domain(p_domain text) returns text
language sql stable security definer set search_path = public as $$
  select p.store_slug
    from public.store_domains d
    join public.profiles p on p.id = d.user_id
   where d.domain = regexp_replace(lower(trim(left(p_domain, 253))), '^www\.', '')
     and d.active and p.store_enabled and p.store_slug is not null
     and public.plan_rank(public.current_plan(p.id)) >= 2
   limit 1;
$$;
grant execute on function public.store_slug_for_domain(text) to anon, authenticated;

notify pgrst, 'reload schema';
