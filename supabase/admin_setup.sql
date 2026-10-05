-- =====================================================================
--  Primer arranque: crea tu licencia de administradora (código aleatorio)
--  1) Ejecuta este bloque en Supabase → SQL Editor: el resultado te muestra el código
--  2) Regístrate en la app (/registro) con ese código
--  3) Ejecuta el UPDATE de abajo con tu correo para volverte administradora
-- =====================================================================
insert into public.licenses (code, notes)
values (public.generate_license_code(), 'Licencia de la administradora')
returning code;

-- Después de registrarte:
-- update public.profiles set role = 'admin' where email = 'tu-correo@ejemplo.com';
