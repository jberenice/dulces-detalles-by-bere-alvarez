-- =====================================================================
--  0012 · Diseños de impresos (tarjetas, etiquetas, stickers y QR)
--        + corrección de recetas de ejemplo de 3 leches
--  Ejecutar después de 0011 (se puede ejecutar más de una vez).
--  Antes vuelve a ejecutar 0002_seed_function.sql para que las cuentas nuevas
--  (y la demo) usen media crema en lugar de leche de coco en el 3 leches.
-- =====================================================================

alter table public.profiles add column if not exists print_designs jsonb not null default '{}'::jsonb;
do $$ begin
  alter table public.profiles add constraint profiles_print_designs_valid
    check (jsonb_typeof(print_designs) = 'object' and pg_column_size(print_designs) < 16000) not valid;
exception when duplicate_object then null; end $$;

-- Recetas de ejemplo ya creadas: en la sección "3 leches", la leche de coco pasa a media crema
update public.dessert_items di
   set ingredient_id = mc.id
  from public.ingredients lc, public.ingredients mc
 where di.ingredient_id = lc.id
   and lc.name = 'Leche de coco' and lc.kind = 'ingrediente'
   and mc.user_id = lc.user_id and mc.name = 'media crema lata' and mc.kind = 'ingrediente'
   and di.section = '3 leches';

notify pgrst, 'reload schema';
