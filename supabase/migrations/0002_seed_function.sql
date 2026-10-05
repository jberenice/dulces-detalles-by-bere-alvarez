-- =====================================================================
--  Datos iniciales (tomados de tus hojas de Excel: Cupcakes.xlsx y Control de costos.xlsx)
--  Se copian a cada usuario nuevo que active su licencia con "precargar datos".
-- =====================================================================
create or replace function public.seed_starter_data(p_uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_d uuid;
begin
  if p_uid is null then return; end if;
  if exists (select 1 from public.ingredients where user_id = p_uid) then return; end if;

  insert into public.fixed_costs (user_id, name, monthly_amount) values
    (p_uid, 'Luz', 750.0),
    (p_uid, 'Agua', 500.0),
    (p_uid, 'Teléfono', 470.0),
    (p_uid, 'Internet', 560.0),
    (p_uid, 'Publicidad', 400.0),
    (p_uid, 'Bazar villamar', 400.0),
    (p_uid, 'Bazar hecho por ellas', 300.0),
    (p_uid, 'Renta', 6000.0),
    (p_uid, 'Gas', 600.0),
    (p_uid, 'Gasolina', 1800.0),
    (p_uid, 'Limpieza', 350.0),
    (p_uid, 'Sueldo 1', 8000.0),
    (p_uid, 'Vendedor', 700.0);

  insert into public.ingredients (user_id, kind, name, unit, package_qty, package_price) values
    (p_uid, 'ingrediente', 'Plátano', 'pz', 4.0, 30.12),
    (p_uid, 'ingrediente', 'Azúcar estándar', 'g', 2000.0, 47.0),
    (p_uid, 'ingrediente', 'Azúcar morena', 'g', 1000.0, 47.0),
    (p_uid, 'ingrediente', 'Aceite', 'ml', 1000.0, 40.0),
    (p_uid, 'ingrediente', 'Huevos', 'pz', 30.0, 60.0),
    (p_uid, 'ingrediente', 'Vainilla', 'ml', 1000.0, 20.5),
    (p_uid, 'ingrediente', 'Royal', 'g', 1000.0, 79.0),
    (p_uid, 'ingrediente', 'Harina', 'g', 2000.0, 31.0),
    (p_uid, 'ingrediente', 'Cocoa', 'g', 1000.0, 257.0),
    (p_uid, 'ingrediente', 'Margarina', 'g', 1000.0, 52.0),
    (p_uid, 'ingrediente', 'sal', 'g', 1000.0, 18.95),
    (p_uid, 'ingrediente', 'Toronja', 'g', 1000.0, 26.0),
    (p_uid, 'ingrediente', 'Limón', 'g', 1000.0, 25.0),
    (p_uid, 'ingrediente', 'Fécula de maiz', 'g', 1000.0, 40.85),
    (p_uid, 'ingrediente', 'Bicarbonato de sodio', 'g', 1000.0, 39.0),
    (p_uid, 'ingrediente', 'Azúcar refinada', 'g', 2000.0, 51.5),
    (p_uid, 'ingrediente', 'Tequila', 'ml', 1200.0, 195.0),
    (p_uid, 'ingrediente', 'Crema ácida', 'g', 900.0, 82.0),
    (p_uid, 'ingrediente', 'Manteca', 'g', 1000.0, 72.0),
    (p_uid, 'ingrediente', 'Azúcar glass', 'g', 5000.0, 181.35),
    (p_uid, 'ingrediente', 'Colorante', 'ml', 40.0, 40.6),
    (p_uid, 'ingrediente', 'Leche', 'ml', 1500.0, 31.0),
    (p_uid, 'ingrediente', 'Levadura', 'g', 55.0, 26.0),
    (p_uid, 'ingrediente', 'Esencia de Azahar', 'ml', 1000.0, 355.0),
    (p_uid, 'ingrediente', 'Brandy', 'ml', 900.0, 185.0),
    (p_uid, 'ingrediente', 'Harina de Fuerza', 'g', 10000.0, 498.0),
    (p_uid, 'ingrediente', 'Naranja', 'g', 1000.0, 38.9),
    (p_uid, 'ingrediente', 'Chocolate monedas', 'g', 1000.0, 98.0),
    (p_uid, 'ingrediente', 'Crema de avellanas', 'g', 1000.0, 121.74),
    (p_uid, 'ingrediente', 'Queso crema', 'g', 1360.0, 153.5),
    (p_uid, 'ingrediente', 'Crema de coco', 'ml', 1000.0, 71.0),
    (p_uid, 'ingrediente', 'Vinagre blanco', 'ml', 1000.0, 16.0),
    (p_uid, 'ingrediente', 'Galletas maría', 'g', 432.0, 27.5),
    (p_uid, 'ingrediente', 'Crema para batir', 'ml', 1000.0, 95.0),
    (p_uid, 'ingrediente', 'Fresas', 'g', 454.0, 89.0),
    (p_uid, 'ingrediente', 'Frambuesas', 'g', 170.0, 53.0),
    (p_uid, 'ingrediente', 'Zarzamora', 'g', 170.0, 53.0),
    (p_uid, 'ingrediente', 'Leche condensada', 'ml', 985.0, 63.95),
    (p_uid, 'ingrediente', 'Leche evaporada', 'ml', 930.0, 46.0),
    (p_uid, 'ingrediente', 'Leche de coco', 'ml', 1000.0, 53.0),
    (p_uid, 'ingrediente', 'camote morado', 'g', 1000.0, 59.0),
    (p_uid, 'ingrediente', 'coco', 'pz', 1.0, 150.0),
    (p_uid, 'ingrediente', 'canela entera', 'pz', 8.0, 33.0),
    (p_uid, 'ingrediente', 'Agua', 'ml', 20000.0, 48.0),
    (p_uid, 'ingrediente', 'Chocolate puratos', 'g', 1000.0, 360.0),
    (p_uid, 'ingrediente', 'Durazno', 'g', 480.0, 66.0),
    (p_uid, 'ingrediente', 'grenetina', 'g', 28.0, 26.5),
    (p_uid, 'ingrediente', 'nuez', 'g', 100.0, 77.0),
    (p_uid, 'ingrediente', 'esencia de fresa', 'ml', 1000.0, 469.0),
    (p_uid, 'ingrediente', 'cacao polvo', 'g', 1000.0, 230.0),
    (p_uid, 'ingrediente', 'triple sec', 'ml', 1000.0, 151.0),
    (p_uid, 'ingrediente', 'mezcal', 'ml', 700.0, 278.0),
    (p_uid, 'ingrediente', 'café', 'g', 200.0, 138.0),
    (p_uid, 'ingrediente', 'sal de gusano', 'g', 1000.0, 298.0),
    (p_uid, 'ingrediente', 'pulpa de mango', 'ml', 1000.0, 165.0),
    (p_uid, 'ingrediente', 'coco en polo', 'g', 500.0, 265.0),
    (p_uid, 'ingrediente', 'chamoy mega', 'ml', 1000.0, 35.0),
    (p_uid, 'ingrediente', 'miguelito', 'g', 950.0, 84.5),
    (p_uid, 'ingrediente', 'piloncillo', 'g', 1000.0, 69.97),
    (p_uid, 'ingrediente', 'clavo de olor', 'g', 500.0, 69.0),
    (p_uid, 'ingrediente', 'cajeta horneable', 'g', 1000.0, 160.0),
    (p_uid, 'ingrediente', 'canela en polvo', 'g', 1000.0, 72.0),
    (p_uid, 'ingrediente', 'chile ancho', 'g', 250.0, 42.0),
    (p_uid, 'ingrediente', 'cobertura chocolate blanco', 'g', 1000.0, 135.0),
    (p_uid, 'ingrediente', 'canela molida', 'g', 1000.0, 72.0),
    (p_uid, 'ingrediente', 'granillo alpezi', 'g', 500.0, 115.0),
    (p_uid, 'ingrediente', 'cafe soluble great', 'g', 100.0, 96.0),
    (p_uid, 'ingrediente', 'zanahoria', 'g', 1000.0, 18.0),
    (p_uid, 'ingrediente', 'jengibre', 'g', 1000.0, 129.0),
    (p_uid, 'ingrediente', 'nuez moscada', 'g', 500.0, 195.0),
    (p_uid, 'ingrediente', 'pasas', 'g', 150.0, 25.0),
    (p_uid, 'ingrediente', 'media crema lata', 'g', 225.0, 23.0),
    (p_uid, 'ingrediente', 'Chocolate blanco alpezzi', 'g', 5000.0, 776.0),
    (p_uid, 'ingrediente', 'CMC', 'g', 100.0, 129.0),
    (p_uid, 'ingrediente', 'Fondant', 'g', 1000.0, 143.0),
    (p_uid, 'ingrediente', 'RKT', 'g', 250.0, 99.0),
    (p_uid, 'ingrediente', 'Malavisco', 'g', 250.0, 39.0),
    (p_uid, 'ingrediente', 'canelitas', 'g', 224.0, 30.0),
    (p_uid, 'ingrediente', 'graham galletas', 'g', 408.0, 202.0),
    (p_uid, 'ingrediente', 'base galleta', 'pz', 1.0, 60.0),
    (p_uid, 'empaque', 'Capacillos', 'pz', 500.0, 83.55),
    (p_uid, 'empaque', 'Bolsas de celofán', 'pz', 100.0, 70.0),
    (p_uid, 'empaque', 'Bolsas craft #6', 'pz', 100.0, 59.0),
    (p_uid, 'empaque', 'Blondas grandes', 'pz', 25.0, 36.0),
    (p_uid, 'empaque', 'Listón', 'cm', 100.0, 16.0),
    (p_uid, 'empaque', 'Pipeta', 'pz', 100.0, 119.13),
    (p_uid, 'empaque', 'Caja individuual cupcake', 'pz', 60.0, 488.92),
    (p_uid, 'empaque', 'caja doble cupcake', 'pz', 10.0, 150.48),
    (p_uid, 'empaque', 'caja triple cupcake', 'pz', 10.0, 0.0),
    (p_uid, 'empaque', 'caja 6 cupcakes', 'pz', 10.0, 245.64),
    (p_uid, 'empaque', 'caja 4 cupcakes', 'pz', 10.0, 185.61),
    (p_uid, 'empaque', 'Domo', 'pz', 1.0, 21.0),
    (p_uid, 'empaque', 'bisagra para pastel', 'pz', 1.0, 5.5),
    (p_uid, 'empaque', 'impresiones', 'pz', 1.0, 20.0),
    (p_uid, 'empaque', 'Diseño', 'pz', 1.0, 10.0),
    (p_uid, 'empaque', 'Base #24', 'pz', 1.0, 20.0),
    (p_uid, 'empaque', 'Base #32', 'pz', 1.0, 30.0),
    (p_uid, 'empaque', 'vaso 250ml', 'pz', 50.0, 250.15),
    (p_uid, 'empaque', 'vaso 360ml', 'pz', 50.0, 274.15),
    (p_uid, 'empaque', 'vaso 500ml', 'pz', 50.0, 311.15),
    (p_uid, 'empaque', 'vaso cuadrado', 'pz', 20.0, 172.0),
    (p_uid, 'empaque', 'cucharas', 'pz', 100.0, 41.5),
    (p_uid, 'empaque', 'Bolsa Aliexpress', 'pz', 60.0, 108.66),
    (p_uid, 'empaque', 'vaso 5,5 oz', 'pz', 50.0, 27.0),
    (p_uid, 'empaque', 'moño', 'pz', 1.0, 25.0),
    (p_uid, 'empaque', 'papel china', 'pz', 1.0, 2.0),
    (p_uid, 'empaque', 'papel coreano', 'pz', 100.0, 234.06),
    (p_uid, 'empaque', 'cinta diurex', 'pz', 1.0, 27.0),
    (p_uid, 'empaque', 'oblea', 'pz', 1.0, 35.0),
    (p_uid, 'empaque', 'caja 6', 'pz', 1.0, 35.0),
    (p_uid, 'empaque', 'caja 4', 'pz', 1.0, 18.561),
    (p_uid, 'empaque', 'caja ind', 'pz', 1.0, 8.148667),
    (p_uid, 'empaque', 'caja pastel mini', 'pz', 10.0, 283.1),
    (p_uid, 'empaque', 'base mdf', 'pz', 5.0, 283.1),
    (p_uid, 'empaque', 'soportes para pastel', 'pz', 40.0, 199.12),
    (p_uid, 'empaque', 'base 15cm', 'pz', 25.0, 207.0),
    (p_uid, 'empaque', 'caja pastel 25', 'pz', 12.0, 292.32),
    (p_uid, 'empaque', 'aso 500ml', 'pz', 1.0, 1.0),
    (p_uid, 'empaque', 'etiqueta', 'pz', 1.0, 0.5),
    (p_uid, 'empaque', 'etiquetas', 'pz', 1.0, 0.5),
    (p_uid, 'empaque', 'impresión', 'pz', 1.0, 28.0),
    (p_uid, 'empaque', 'suaje doble', 'pz', 1.0, 70.0);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Margarita', 'Cupcakes', 14, 'pieza', 4.5, 30.0, 5, true, 65, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 100.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 180.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 2.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 200.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 7.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Limón' limit 1), null, 64.0, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche' limit 1), null, 160.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Manteca' limit 1), null, 75.0, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 75.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar glass' limit 1), null, 300.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Queso crema' limit 1), null, 150.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Limón' limit 1), null, 30.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Tequila' limit 1), null, 10.0, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'triple sec' limit 1), null, 5.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar estándar' limit 1), null, 40.0, 14),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Agua' limit 1), null, 40.0, 15),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Limón' limit 1), null, 15.0, 16),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Tequila' limit 1), null, 20.0, 17),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'triple sec' limit 1), null, 10.0, 18),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 1.5, 19),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 60.0, 20),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Limón' limit 1), null, 30.0, 21),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Tequila' limit 1), null, 10.0, 22),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'triple sec' limit 1), null, 10.0, 23),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Fécula de maiz' limit 1), null, 20.0, 24),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Capacillos' limit 1), null, 14.0, 25),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Pipeta' limit 1), null, 14.0, 26),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'caja 4 cupcakes' limit 1), null, 3.0, 27),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Caja individuual cupcake' limit 1), null, 2.0, 28);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Paloma', 'Cupcakes', 14, 'pieza', 4.5, 30.0, 5, true, 65, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 100.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 180.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 2.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 200.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 7.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Limón' limit 1), null, 772.0, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche' limit 1), null, 160.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Manteca' limit 1), null, 150.0, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 150.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar glass' limit 1), null, 300.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Tequila' limit 1), null, 20.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar estándar' limit 1), null, 50.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Limón' limit 1), null, 30.0, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Tequila' limit 1), null, 15.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 1.5, 14),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 60.0, 15),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Tequila' limit 1), null, 10.0, 16),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Fécula de maiz' limit 1), null, 20.0, 17),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Capacillos' limit 1), null, 14.0, 18),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Pipeta' limit 1), null, 14.0, 19),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'caja 4 cupcakes' limit 1), null, 3.0, 20),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Caja individuual cupcake' limit 1), null, 2.0, 21);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Mezcal', 'Cupcakes', 14, 'pieza', 4.5, 30.0, 5, true, 90, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 100.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar morena' limit 1), null, 160.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 2.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 140.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 7.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 5.0, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Crema para batir' limit 1), null, 60.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'cacao polvo' limit 1), null, 40.0, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Agua' limit 1), null, 80.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'café' limit 1), null, 10.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'mezcal' limit 1), null, 25.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Levadura' limit 1), null, 100.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Fécula de maiz' limit 1), null, 100.0, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Esencia de Azahar' limit 1), null, 200.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Chocolate puratos' limit 1), null, 150.0, 14),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'cacao polvo' limit 1), null, 20.0, 15),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'mezcal' limit 1), null, 10.0, 16),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Chocolate puratos' limit 1), null, 100.0, 17),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Crema para batir' limit 1), null, 80.0, 18),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'mezcal' limit 1), null, 10.0, 19),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar estándar' limit 1), null, 70.0, 20),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Agua' limit 1), null, 70.0, 21),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'mezcal' limit 1), null, 30.0, 22),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 5.0, 23),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Capacillos' limit 1), null, 14.0, 24),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Pipeta' limit 1), null, 14.0, 25),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'caja 4 cupcakes' limit 1), null, 3.0, 26),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Caja individuual cupcake' limit 1), null, 2.0, 27);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Mango chamoy', 'Cupcakes', 18, 'pieza', 3.0, 30.0, 5, true, 45, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 100.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 250.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 2.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 250.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 10.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche de coco' limit 1), null, 160.0, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'pulpa de mango' limit 1), null, 120.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'coco en polo' limit 1), null, 60.0, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Agua' limit 1), null, 60.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar estándar' limit 1), null, 40.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'pulpa de mango' limit 1), null, 25.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Limón' limit 1), null, 5.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Manteca' limit 1), null, 75.0, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Bicarbonato de sodio' limit 1), null, 75.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar glass' limit 1), null, 300.0, 14),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Queso crema' limit 1), null, 150.0, 15),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'pulpa de mango' limit 1), null, 15.0, 16),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'pulpa de mango' limit 1), null, 160.0, 17),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar estándar' limit 1), null, 30.0, 18),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'chamoy mega' limit 1), null, 30.0, 19),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Limón' limit 1), null, 5.0, 20),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Fécula de maiz' limit 1), null, 10.0, 21),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Agua' limit 1), null, 15.0, 22),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Capacillos' limit 1), null, 18.0, 23),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Pipeta' limit 1), null, 18.0, 24),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'caja 4 cupcakes' limit 1), null, 4.0, 25),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Caja individuual cupcake' limit 1), null, 2.0, 26);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Café de olla', 'Cupcakes', 12, 'pieza', 3.0, 30.0, 5, true, 55, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 100.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 150.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 2.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 180.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 7.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 5.0, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Agua' limit 1), null, 140.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'piloncillo' limit 1), null, 24.0, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'canela entera' limit 1), null, 0.1, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'clavo de olor' limit 1), null, 2.5, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'café' limit 1), null, 6.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar estándar' limit 1), null, 30.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'cajeta horneable' limit 1), null, 120.0, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Fécula de maiz' limit 1), null, 10.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Manteca' limit 1), null, 75.0, 14),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Bicarbonato de sodio' limit 1), null, 75.0, 15),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar glass' limit 1), null, 300.0, 16),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Queso crema' limit 1), null, 150.0, 17),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'café' limit 1), null, 8.0, 18),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'canela en polvo' limit 1), null, 3.0, 19),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 5.0, 20),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Capacillos' limit 1), null, 12.0, 21),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Pipeta' limit 1), null, 12.0, 22),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'caja 4 cupcakes' limit 1), null, 3.0, 23);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Churro', 'Cupcakes', 12, 'pieza', 3.0, 30.0, 5, true, 55, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 100.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 200.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 2.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 200.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 12.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 10.0, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche' limit 1), null, 160.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'canela en polvo' limit 1), null, 5.0, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Agua' limit 1), null, 60.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar estándar' limit 1), null, 40.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'canela en polvo' limit 1), null, 2.5, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 2.5, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'cajeta horneable' limit 1), null, 180.0, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Crema para batir' limit 1), null, 30.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Manteca' limit 1), null, 75.0, 14),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Queso crema' limit 1), null, 150.0, 15),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 75.0, 16),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar glass' limit 1), null, 300.0, 17),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Agua' limit 1), null, 31.25, 18),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 3.75, 19),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 0.125, 20),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 17.5, 21),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Aceite' limit 1), null, 250.0, 22),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar estándar' limit 1), null, 15.0, 23),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'canela en polvo' limit 1), null, 1.25, 24),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'canela en polvo' limit 1), null, 5.0, 25),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Capacillos' limit 1), null, 12.0, 26),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'caja 4 cupcakes' limit 1), null, 3.0, 27);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Chocolate mexicano', 'Cupcakes', 14, 'pieza', 3.0, 30.0, 5, true, 55, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 100.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar morena' limit 1), null, 160.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 2.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 140.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Cocoa' limit 1), null, 40.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 5.0, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 9.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche' limit 1), null, 140.0, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Manteca' limit 1), null, 100.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 100.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 200.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Esencia de Azahar' limit 1), null, 150.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'chile ancho' limit 1), null, 10.0, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Agua' limit 1), null, 60.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar estándar' limit 1), null, 30.0, 14),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Cocoa' limit 1), null, 10.0, 15),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'canela en polvo' limit 1), null, 2.5, 16),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Esencia de Azahar' limit 1), null, 120.0, 17),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Crema para batir' limit 1), null, 90.0, 18),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'canela en polvo' limit 1), null, 2.5, 19),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 5.0, 20),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Capacillos' limit 1), null, 14.0, 21),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'caja 4 cupcakes' limit 1), null, 3.0, 22),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Caja individuual cupcake' limit 1), null, 2.0, 23);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Vainilla', 'Cupcakes', 14, 'pieza', 8.0, 30.0, 5, true, 155, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 100.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 200.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 2.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 200.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 12.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 10.0, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche' limit 1), null, 160.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Manteca' limit 1), null, 108.0, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 125.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar glass' limit 1), null, 500.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Crema de coco' limit 1), null, 15.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 5.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), 'Cotización 21 de septiembre', 200.0, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), 'Cotización 21 de septiembre', 400.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), 'Cotización 21 de septiembre', 4.0, 14),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), 'Cotización 21 de septiembre', 400.0, 15),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), 'Cotización 21 de septiembre', 24.0, 16),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), 'Cotización 21 de septiembre', 20.0, 17),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche' limit 1), 'Cotización 21 de septiembre', 320.0, 18),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Manteca' limit 1), 'Cotización 21 de septiembre', 300.0, 19),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), 'Cotización 21 de septiembre', 300.0, 20),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar glass' limit 1), 'Cotización 21 de septiembre', 600.0, 21),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), 'Cotización 21 de septiembre', 10.0, 22),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), 'Cotización 21 de septiembre', 200.0, 23),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar estándar' limit 1), 'Cotización 21 de septiembre', 320.0, 24),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), 'Cotización 21 de septiembre', 4.0, 25),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), 'Cotización 21 de septiembre', 280.0, 26),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Cocoa' limit 1), 'Cotización 21 de septiembre', 80.0, 27),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), 'Cotización 21 de septiembre', 10.0, 28),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), 'Cotización 21 de septiembre', 18.0, 29),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche' limit 1), 'Cotización 21 de septiembre', 280.0, 30),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Manteca' limit 1), 'Cotización 21 de septiembre', 200.0, 31),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), 'Cotización 21 de septiembre', 200.0, 32),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar glass' limit 1), 'Cotización 21 de septiembre', 400.0, 33),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'cobertura chocolate blanco' limit 1), 'Cotización 21 de septiembre', 300.0, 34),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Capacillos' limit 1), null, 14.0, 35),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'oblea' limit 1), null, 1.0, 36),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'caja 4 cupcakes' limit 1), null, 3.0, 37),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Capacillos' limit 1), null, 56.0, 38),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'caja 6 cupcakes' limit 1), null, 5.0, 39),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'vaso 5,5 oz' limit 1), null, 25.0, 40),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'cinta diurex' limit 1), null, 2.0, 41),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'papel coreano' limit 1), null, 6.0, 42),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'papel china' limit 1), null, 2.0, 43),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'moño' limit 1), null, 6.0, 44);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Chocolate', 'Cupcakes', 14, 'pieza', 1.5, 25.0, 5, true, 40, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 100.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar morena' limit 1), null, 160.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 2.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 140.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Cocoa' limit 1), null, 40.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 9.0, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche' limit 1), null, 140.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Manteca' limit 1), null, 100.0, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 100.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar glass' limit 1), null, 200.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Chocolate monedas' limit 1), null, 150.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'caja 4 cupcakes' limit 1), null, 5.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Capacillos' limit 1), null, 14.0, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'caja 6' limit 1), null, 1.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'caja 4 cupcakes' limit 1), null, 3.0, 14),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Caja individuual cupcake' limit 1), null, 2.0, 15);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Nutella', 'Cupcakes', 14, 'pieza', 1.5, 30.0, 5, true, 30, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 40.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 140.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 1.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 100.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Cocoa' limit 1), null, 30.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Crema de avellanas' limit 1), null, 70.0, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 12.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'sal' limit 1), null, 1.0, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche' limit 1), null, 100.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 75.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Manteca' limit 1), null, 75.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar glass' limit 1), null, 150.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Crema de avellanas' limit 1), null, 105.0, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Capacillos' limit 1), null, 14.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'caja 4' limit 1), null, 3.0, 14),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'caja ind' limit 1), null, 2.0, 15);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Tequila', 'Cupcakes', 12, 'pieza', 2.0, 30.0, 5, true, 50, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Toronja' limit 1), null, 246.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Limón' limit 1), null, 30.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 375.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Fécula de maiz' limit 1), null, 60.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 5.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Bicarbonato de sodio' limit 1), null, 3.0, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'sal' limit 1), null, 6.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 254.0, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 300.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 3.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Tequila' limit 1), null, 108.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Tequila' limit 1), null, 225.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Manteca' limit 1), null, 150.0, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar glass' limit 1), null, 900.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Colorante' limit 1), null, 5.0, 14),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Capacillos' limit 1), null, 12.0, 15),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'caja 6 cupcakes' limit 1), null, 2.0, 16),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Pipeta' limit 1), null, 12.0, 17);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Red Velvet', 'Cupcakes', 12, 'pieza', 1.5, 30.0, 5, true, 40, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 100.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 200.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 2.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 200.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Cocoa' limit 1), null, 12.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 10.0, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche' limit 1), null, 160.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vinagre blanco' limit 1), null, 108.0, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Limón' limit 1), null, 125.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Bicarbonato de sodio' limit 1), null, 500.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Colorante' limit 1), null, 15.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Manteca' limit 1), null, 75.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Queso crema' limit 1), null, 150.0, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 75.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar glass' limit 1), null, 300.0, 14),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Capacillos' limit 1), null, 12.0, 15),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'caja 4 cupcakes' limit 1), null, 3.0, 16);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Fresa y Nata', 'Cupcakes', 12, 'pieza', 1.5, 30.0, 5, true, 35, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 100.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 200.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 2.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 200.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 12.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 10.0, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Crema para batir' limit 1), null, 160.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Manteca' limit 1), null, 108.0, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 125.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar glass' limit 1), null, 500.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'esencia de fresa' limit 1), null, 15.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Capacillos' limit 1), null, 12.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'caja 6 cupcakes' limit 1), null, 2.0, 12);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Pay de limón', 'Postres', 1, 'pastel', 2.5, 50.0, 5, true, 650, false) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'base galleta' limit 1), null, 1.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche' limit 1), null, 450.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Fécula de maiz' limit 1), null, 90.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 6.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 225.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Limón' limit 1), null, 720.0, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), 'Relleno crema pastelera chocolate', 224.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'aso 500ml' limit 1), null, 1.0, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Diseño' limit 1), null, 1.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'caja pastel 25' limit 1), null, 1.0, 9);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Cheesecake', 'Postres', 1, 'pastel', 1.5, 50.0, 5, true, 435, false) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'graham galletas' limit 1), null, 60.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 33.333333, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Queso crema' limit 1), null, 166.666667, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Fécula de maiz' limit 1), null, 1.666667, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Crema para batir' limit 1), null, 53.333333, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 1.666667, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 1.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 40.0, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Limón' limit 1), null, 40.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Fresas' limit 1), 'Mermelada de fresa', 90.8, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), 'Mermelada de fresa', 2.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar estándar' limit 1), 'Mermelada de fresa', 23.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Fécula de maiz' limit 1), 'Mermelada de fresa', 3.0, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Crema para batir' limit 1), 'Mermelada de fresa', 18.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Domo' limit 1), null, 2.0, 14);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Pan de plátano', 'Postres', 1, 'pastel', 1.5, 10.0, 5, true, 290, false) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Plátano' limit 1), null, 4.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar estándar' limit 1), null, 80.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar morena' limit 1), null, 80.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Aceite' limit 1), null, 150.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Chocolate puratos' limit 1), null, 80.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 2.0, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 5.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 25.0, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 250.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Bolsas craft #6' limit 1), null, 1.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Blondas grandes' limit 1), null, 1.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'etiqueta' limit 1), null, 1.0, 11);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Brownies', 'Postres', 1, 'pastel', 1.5, 20.0, 5, true, 280, false) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 4.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 180.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar estándar' limit 1), null, 400.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 190.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'cacao polvo' limit 1), null, 90.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 5.0, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 5.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'sal' limit 1), null, 1.0, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Bolsas de celofán' limit 1), null, 10.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'etiquetas' limit 1), null, 10.0, 9);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Tarta vasca', 'Postres', 1, 'pastel', 2.0, 50.0, 5, true, 615, false) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 210.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 210.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 8.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 6.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 8.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche condensada' limit 1), '3 leches', 333.33, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche evaporada' limit 1), '3 leches', 333.33, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche de coco' limit 1), '3 leches', 333.33, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), 'Relleno crema pastelera chocolate', 4.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), 'Relleno crema pastelera chocolate', 30.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar estándar' limit 1), 'Relleno crema pastelera chocolate', 115.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Fécula de maiz' limit 1), 'Relleno crema pastelera chocolate', 50.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche' limit 1), 'Relleno crema pastelera chocolate', 500.0, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Crema para batir' limit 1), 'Relleno crema pastelera chocolate', 500.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'impresiones' limit 1), null, 1.0, 14);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Pastel 3 leches', 'Pasteles', 1, 'pastel', 2.0, 50.0, 5, true, 625, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 210.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 210.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 8.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 6.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 8.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche condensada' limit 1), '3 leches', 333.33, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche evaporada' limit 1), '3 leches', 333.33, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche de coco' limit 1), '3 leches', 333.33, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), 'Relleno crema pastelera chocolate', 4.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), 'Relleno crema pastelera chocolate', 30.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar estándar' limit 1), 'Relleno crema pastelera chocolate', 115.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Fécula de maiz' limit 1), 'Relleno crema pastelera chocolate', 50.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche' limit 1), 'Relleno crema pastelera chocolate', 500.0, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Crema para batir' limit 1), 'Relleno crema pastelera chocolate', 500.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'impresión' limit 1), null, 1.0, 14);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, '3 leches con fresas', 'Pasteles', 1, 'pastel', 2.0, 50.0, 5, true, 1090, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 350.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 350.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 13.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 10.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 13.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche condensada' limit 1), '3 leches', 333.33, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche evaporada' limit 1), '3 leches', 333.33, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche de coco' limit 1), '3 leches', 333.33, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Queso crema' limit 1), 'Relleno crema pastelera chocolate', 125.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), 'Relleno crema pastelera chocolate', 30.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar glass' limit 1), 'Relleno crema pastelera chocolate', 115.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'grenetina' limit 1), 'Relleno crema pastelera chocolate', 50.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Agua' limit 1), 'Relleno crema pastelera chocolate', 100.0, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar estándar' limit 1), 'Relleno crema pastelera chocolate', 125.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Limón' limit 1), 'Relleno crema pastelera chocolate', 720.0, 14),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Fresas' limit 1), 'Relleno crema pastelera chocolate', 500.0, 15),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Crema para batir' limit 1), 'Relleno crema pastelera chocolate', 500.0, 16),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'suaje doble' limit 1), null, 1.0, 17),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'impresión' limit 1), null, 3.0, 18);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Pastel atropellado', 'Pasteles', 1, 'pastel', 1.5, 20.0, 5, true, 705, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 210.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 210.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 7.5, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 6.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 7.5, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche condensada' limit 1), '3 leches', 250.0, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche evaporada' limit 1), '3 leches', 250.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche de coco' limit 1), '3 leches', 250.0, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'camote morado' limit 1), 'Relleno camote y coco', 500.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'coco' limit 1), 'Relleno camote y coco', 1.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar estándar' limit 1), 'Relleno camote y coco', 100.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'canela entera' limit 1), 'Relleno camote y coco', 1.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Agua' limit 1), 'Relleno camote y coco', 500.0, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Naranja' limit 1), 'Relleno camote y coco', 200.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Crema para batir' limit 1), 'Relleno camote y coco', 500.0, 14),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'bisagra para pastel' limit 1), null, 10.0, 15);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Pastel 3 leches chocolate', 'Pasteles', 1, 'pastel', 1.5, 50.0, 5, true, 655, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 210.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 210.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 8.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 6.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 8.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche condensada' limit 1), '3 leches', 333.33, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche evaporada' limit 1), '3 leches', 333.33, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche de coco' limit 1), '3 leches', 333.33, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), 'Relleno crema pastelera chocolate', 4.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), 'Relleno crema pastelera chocolate', 30.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar estándar' limit 1), 'Relleno crema pastelera chocolate', 115.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Fécula de maiz' limit 1), 'Relleno crema pastelera chocolate', 50.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Chocolate puratos' limit 1), 'Relleno crema pastelera chocolate', 180.0, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche' limit 1), 'Relleno crema pastelera chocolate', 500.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Crema para batir' limit 1), 'Relleno crema pastelera chocolate', 500.0, 14),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'impresiones' limit 1), null, 1.0, 15);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Pastel chocolate', 'Pasteles', 1, 'pastel', 2.0, 50.0, 5, true, 905, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 360.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 560.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 10.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 4.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Aceite' limit 1), null, 240.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche' limit 1), null, 320.0, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'cacao polvo' limit 1), null, 120.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Agua' limit 1), null, 200.0, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 22.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Chocolate puratos' limit 1), 'Relleno', 350.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Crema para batir' limit 1), 'Relleno', 700.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Chocolate puratos' limit 1), 'Drip y decoración', 4.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Crema para batir' limit 1), 'Drip y decoración', 30.0, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'granillo alpezi' limit 1), 'Drip y decoración', 115.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Diseño' limit 1), null, 1.0, 14),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'impresión' limit 1), null, 1.0, 15);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Pastel moka', 'Pasteles', 1, 'pastel', 1.5, 50.0, 5, true, 675, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 4.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 320.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Aceite' limit 1), null, 160.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche' limit 1), null, 160.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 20.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 240.0, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'cacao polvo' limit 1), null, 80.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 15.0, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'sal' limit 1), null, 2.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Agua' limit 1), null, 135.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'cafe soluble great' limit 1), null, 20.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Chocolate puratos' limit 1), 'Ganache', 106.666, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Crema para batir' limit 1), 'Ganache', 53.333, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), 'Ganache', 26.666, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), 'Buttercream', 5.0, 14),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), 'Buttercream', 346.666, 15),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), 'Buttercream', 520.0, 16),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'cafe soluble great' limit 1), 'Buttercream', 40.0, 17),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Agua' limit 1), 'Buttercream', 7.0, 18),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'vaso 500ml' limit 1), null, 10.0, 19);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Pastel zanahoria', 'Pasteles', 1, 'pastel', 1.5, 50.0, 5, true, 825, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 4.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar morena' limit 1), null, 333.333, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Aceite' limit 1), null, 250.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'zanahoria' limit 1), null, 333.333, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'canela molida' limit 1), null, 13.333, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 260.0, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'jengibre' limit 1), null, 2.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 13.333, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'nuez moscada' limit 1), null, 0.7333, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'sal' limit 1), null, 4.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'nuez' limit 1), null, 133.333, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Naranja' limit 1), null, 352.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'pasas' limit 1), null, 133.33, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'nuez' limit 1), 'Decoración', 17.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'zanahoria' limit 1), 'Decoración', 39.0, 14),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), 'Buttercream', 133.333, 15),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Manteca' limit 1), 'Buttercream', 133.333, 16),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Queso crema' limit 1), 'Buttercream', 400.0, 17),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar glass' limit 1), 'Buttercream', 533.33, 18),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'vaso 500ml' limit 1), null, 10.0, 19);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Pastel beso de Angel', 'Pasteles', 1, 'pastel', 1.5, 50.0, 5, true, 635, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 210.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 210.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 8.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 6.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 8.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche condensada' limit 1), '3 leches', 333.33, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche evaporada' limit 1), '3 leches', 333.33, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche de coco' limit 1), '3 leches', 333.33, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche evaporada' limit 1), 'Relleno flan', 250.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche condensada' limit 1), 'Relleno flan', 250.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), 'Relleno flan', 6.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), 'Relleno flan', 5.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar estándar' limit 1), 'Relleno flan', 90.0, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'canela molida' limit 1), 'Relleno flan', 2.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'cajeta horneable' limit 1), 'Relleno flan', 100.0, 14),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Crema para batir' limit 1), 'Relleno flan', 500.0, 15),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'vaso 500ml' limit 1), null, 8.0, 16);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Pastel 3 leches con durazno', 'Pasteles', 1, 'pastel', 1.5, 50.0, 5, true, 675, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 210.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 210.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 8.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 6.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 8.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche condensada' limit 1), '3 leches', 333.33, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche evaporada' limit 1), '3 leches', 333.33, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche de coco' limit 1), '3 leches', 333.33, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Crema para batir' limit 1), 'Relleno duraznos', 400.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Queso crema' limit 1), 'Relleno duraznos', 100.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), 'Relleno duraznos', 5.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar glass' limit 1), 'Relleno duraznos', 100.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'grenetina' limit 1), 'Relleno duraznos', 5.0, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Agua' limit 1), 'Relleno duraznos', 30.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Durazno' limit 1), 'Relleno duraznos', 480.0, 14),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Base #32' limit 1), null, 1.0, 15),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'Diseño' limit 1), null, 3.0, 16);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Queso napolitano', 'Postres', 1, 'pastel', 1.5, 10.0, 5, true, 360, false) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche evaporada' limit 1), null, 250.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche condensada' limit 1), null, 250.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 6.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 5.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar estándar' limit 1), null, 90.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'canela molida' limit 1), null, 2.0, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Queso crema' limit 1), null, 190.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'media crema lata' limit 1), null, 225.0, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'bisagra para pastel' limit 1), null, 10.0, 8);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Pastel 3 leches dulce de leche', 'Pasteles', 1, 'pastel', 1.5, 50.0, 5, true, 645, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 210.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 210.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 8.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 6.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 8.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche condensada' limit 1), '3 leches', 333.33, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche evaporada' limit 1), '3 leches', 333.33, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche de coco' limit 1), '3 leches', 333.33, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), 'Relleno crema pastelera chocolate', 450.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar glass' limit 1), 'Relleno crema pastelera chocolate', 600.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Queso crema' limit 1), 'Relleno crema pastelera chocolate', 150.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'cajeta horneable' limit 1), 'Relleno crema pastelera chocolate', 270.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'vaso 500ml' limit 1), null, 10.0, 12);

  insert into public.desserts (user_id, name, category, yield_units, unit_label, labor_hours, profit_pct, wear_pct, apply_iva, sale_price, store_visible)
  values (p_uid, 'Pastel Oliver', 'Pasteles', 1, 'pastel', 10.0, 70.0, 5, true, 3005, true) returning id into v_d;
  insert into public.dessert_items (user_id, dessert_id, ingredient_id, section, quantity, position) values
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), null, 480.0, 0),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar refinada' limit 1), null, 600.0, 1),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Huevos' limit 1), null, 9.0, 2),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Harina' limit 1), null, 750.0, 3),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), null, 15.0, 4),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Leche' limit 1), null, 360.0, 5),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Royal' limit 1), null, 35.0, 6),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar estándar' limit 1), 'Jarabe vainilla', 60.0, 7),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Agua' limit 1), 'Jarabe vainilla', 60.0, 8),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), 'Jarabe vainilla', 5.0, 9),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Chocolate blanco alpezzi' limit 1), 'Relleno buttercream y cobertura ganache blanco', 480.0, 10),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Crema para batir' limit 1), 'Relleno buttercream y cobertura ganache blanco', 145.0, 11),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), 'Relleno buttercream y cobertura ganache blanco', 120.0, 12),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Manteca' limit 1), 'Relleno buttercream y cobertura ganache blanco', 120.0, 13),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar glass' limit 1), 'Relleno buttercream y cobertura ganache blanco', 120.0, 14),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), 'Relleno buttercream y cobertura ganache blanco', 7.0, 15),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), 'Relleno buttercream y cobertura ganache blanco', 112.5, 16),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Manteca' limit 1), 'Relleno buttercream y cobertura ganache blanco', 112.5, 17),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Azúcar glass' limit 1), 'Relleno buttercream y cobertura ganache blanco', 225.0, 18),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Vainilla' limit 1), 'Relleno buttercream y cobertura ganache blanco', 5.0, 19),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'RKT' limit 1), 'Relleno buttercream y cobertura ganache blanco', 100.0, 20),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Malavisco' limit 1), 'Relleno buttercream y cobertura ganache blanco', 120.0, 21),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Margarina' limit 1), 'Relleno buttercream y cobertura ganache blanco', 15.0, 22),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'CMC' limit 1), 'Relleno buttercream y cobertura ganache blanco', 7.2, 23),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'ingrediente' and name = 'Fondant' limit 1), 'Relleno buttercream y cobertura ganache blanco', 1800.0, 24),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'base mdf' limit 1), null, 1.0, 25),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'base 15cm' limit 1), null, 1.0, 26),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'base 15cm' limit 1), null, 1.0, 27),
    (p_uid, v_d, (select id from public.ingredients where user_id = p_uid and kind = 'empaque' and name = 'soportes para pastel' limit 1), null, 1.0, 28);

end $$;

revoke execute on function public.seed_starter_data(uuid) from anon, authenticated;
