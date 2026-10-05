-- =====================================================================
--  Primer arranque: crea tu licencia de administradora
--  1) Ejecuta este bloque en Supabase → SQL Editor
--  2) Regístrate en la app (/registro) usando el código DD-ADMIN-0000-0001
--  3) Ejecuta el UPDATE de abajo con tu correo para volverte administradora
-- =====================================================================
insert into public.licenses (code, notes)
values ('DD-ADMIN-0000-0001', 'Licencia de la administradora')
on conflict (code) do nothing;

-- Después de registrarte:
-- update public.profiles set role = 'admin' where email = 'tu-correo@ejemplo.com';
