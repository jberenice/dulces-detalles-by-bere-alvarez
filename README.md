# 🧁 Dulces Detalles by Bere Álvarez

Web app responsive para reposterías: **cotizador de postres con PDF**, costeo exacto de recetas (basado en tus hojas de Excel), pedidos, clientes, reportes de ventas y **minitienda en línea** por usuaria — con **licencia única por usuario y un dispositivo activo a la vez**.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase (Postgres, Auth, Storage, RLS) · @react-pdf/renderer · Recharts · Resend · Vercel.

---

## ✨ Funciones

| Módulo | Qué hace |
|---|---|
| **Licencias** | Tú (admin) generas códigos `DD-XXXX-XXXX-XXXX`. Cada código activa **una** cuenta. Solo **un dispositivo** puede estar activo: si la usuaria entra en otro, el anterior se cierra. Puedes suspender, reactivar, poner vencimiento o liberar el dispositivo. |
| **Ingredientes y empaques** | Presentación de compra (ej. 1000 g a $31) → costo por unidad automático. Proveedor y existencias. |
| **Gastos fijos** | Renta, luz, sueldos… repartidos por hora de trabajo (días/mes y horas/día configurables). |
| **Postres (recetas)** | Secciones (pan, relleno, cobertura), empaques, horas de trabajo, % ganancia, % desgaste, envío, IVA y comisión de tarjeta. Resumen final idéntico a tu Excel + precio sugerido redondeado, precio de venta y margen real. |
| **Clientes** | Datos, cumpleaños, notas, historial de pedidos/cotizaciones, WhatsApp directo. |
| **Cotizaciones** | Postres del recetario (precio y costo automáticos) o conceptos libres, descuento, envío, IVA, vigencia. **PDF con tu logo y colores**, envío por **WhatsApp** (en celular adjunta el PDF directo) o **correo** con PDF adjunto. Link público para que el cliente la vea, descargue y **acepte**. Se convierte en pedido con un clic. |
| **Pedidos** | Agenda por fecha de entrega, estados (pendiente → confirmado → preparando → listo → entregado), anticipos/abonos, saldo, nota de pedido en PDF y mensajes rápidos de WhatsApp. |
| **Reportes** | Ventas, utilidad estimada, ticket promedio, cobrado/pendiente, evolución por día/semana/mes, **postres más vendidos** (piezas, ventas o utilidad), por categoría y por canal. Exporta CSV (Excel). |
| **Minitienda** | `tudominio.com/tienda/tu-negocio`: catálogo con fotos, carrito, fecha de entrega, envío o recoger. El pedido se guarda en tu panel y se abre WhatsApp con el resumen. QR descargable. |

Al activar la licencia se puede **precargar el recetario** con tus datos reales: 13 gastos fijos, 122 ingredientes/empaques y 30 recetas (cupcakes, pasteles, pays, cheesecake…) extraídos de `Cupcakes.xlsx` y `Control de costos.xlsx`.

---

## 🚀 Puesta en marcha

### 1. Supabase
1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor** ejecuta, en orden:
   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_seed_function.sql`
   - `supabase/migrations/0003_security.sql` (límites de intentos, aislamiento entre cuentas, licencias aleatorias)
   - `supabase/migrations/0004_facebook_reminders.sql` (Facebook, recordatorios y aceptación de términos)
   - `supabase/migrations/0005_timezones.sql` (zona horaria por usuaria)
   - `supabase/migrations/0006_store_design.sql` (diseño personalizable de la minitienda)
   - `supabase/migrations/0007_inventory_push_templates.sql` (inventario, notificaciones push y plantillas)
   - `supabase/migrations/0008_demo.sql` (cuenta demo de 48 horas)
   - `supabase/migrations/0009_anonymous_hardening.sql` (límites para usuarios anónimos de la demo)
   - `supabase/migrations/0010_premium.sql` (planes, pagos parciales, variantes, zonas, cupo diario, métricas)
   - `supabase/migrations/0011_domains.sql` (subdominios y dominios propios de tiendas)
   - `supabase/migrations/0012_print_designs.sql` (diseños de tarjetas/etiquetas/stickers y 3 leches con media crema; vuelve a correr antes `0002_seed_function.sql`)
   - `supabase/migrations/0013_packages.sql` (paquetes y cajas: contenido fijo o "arma tu caja" con sabores a elegir, en cotizaciones, pedidos, producción, inventario y tienda)
   - `supabase/cron_setup.sql` (recordatorios cada hora; reemplaza tu dominio y tu CRON_SECRET antes de ejecutarlo)
   - `supabase/admin_setup.sql` → el resultado te muestra **tu código de licencia de administradora** (aleatorio)
3. **Authentication → URL Configuration**
   - *Site URL*: `https://TU-APP.vercel.app`
   - *Redirect URLs*: `https://TU-APP.vercel.app/auth/callback` y `http://localhost:3000/auth/callback`
4. (Opcional) **Authentication → Providers → Email**: desactiva *Confirm email* si quieres que la cuenta quede lista al registrarse.

### 2. Variables de entorno
Copia `.env.example` a `.env.local` y llénalo (Supabase → Project Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://TU-REF.supabase.co   # solo el dominio, sin /rest/v1 ni nada más
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=https://TU-APP.vercel.app
RESEND_API_KEY=...            # opcional: envío automático de correos con PDF
RESEND_FROM="Dulces Detalles <cotizaciones@tudominio.com>"
```
Para el **resumen diario de entregas por correo** agrega también `SUPABASE_SERVICE_ROLE_KEY` (secreta, nunca con `NEXT_PUBLIC_`) y `CRON_SECRET` (texto largo aleatorio). Cada usuaria elige en Ajustes su **zona horaria** (se detecta sola la primera vez) y la **hora** del resumen. `supabase/cron_setup.sql` revisa cada hora quién debe recibirlo; `vercel.json` hace una pasada diaria de respaldo.

Sin `RESEND_API_KEY` el botón de correo abre el cliente de correo del usuario y descarga el PDF para adjuntarlo.

### 3. Local
```bash
npm install
npm run dev        # http://localhost:3000
```

### 4. Hazte administradora
1. Entra a `/registro` con el código que te dio `admin_setup.sql`.
2. En SQL Editor: `update public.profiles set role = 'admin' where email = 'tu-correo@ejemplo.com';`
3. En el menú aparece **Administración → Licencias** para generar códigos para tus clientas.

### 5. Deploy en Vercel (plan Pro para uso comercial)
1. Sube el proyecto a GitHub.
2. En Vercel → *New Project* → importa el repo (Framework: Next.js).
3. Agrega las variables de entorno de `.env.example` y despliega.
4. Dominio y subdominios de tiendas: ver la sección **🌐 Dominio y tiendas**.

---

## 🌐 Dominio y tiendas
- Dominio principal: `dulcesdetallesbyberealvarez.com` (landing, panel, cotizaciones).
- Cada tienda: `https://<tienda>.dulcesdetallesbyberealvarez.com` (la "dirección de tu tienda" es el subdominio). La ruta `/tienda/<tienda>` sigue funcionando.
- Dominio propio de una clienta: **Administración → Dominios** → *Conectar dominio* y sigue la guía (agregarlo en Vercel + registros A/CNAME en su proveedor).
- Variables: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ROOT_DOMAIN`. Migración: `0011_domains.sql`.
- En Vercel se agregan `dulcesdetallesbyberealvarez.com`, `www.` y `*.dulcesdetallesbyberealvarez.com`; el comodín requiere los nameservers de Vercel (ns1/ns2.vercel-dns.com).

## ⚖️ Documentos legales
Están en `/aviso-de-privacidad`, `/terminos-y-condiciones` y `/politica-de-cookies`, enlazados en el pie de página. **Completa tu domicilio** en `src/lib/legal.ts` (la ley pide que el aviso de privacidad lo incluya) y pide a un abogado que los revise antes de vender licencias.

## 🔔 Recordatorios de entrega
- **Calendario** (`/dashboard/calendario`) con todas las entregas del mes.
- **Campana** en el panel con pedidos atrasados, de hoy y próximos.
- **Avisos del navegador** en el dispositivo (se activan con un clic; funcionan mientras la app está abierta).
- **Correo diario** con el resumen, a la hora y en la zona horaria de cada usuaria (Supabase pg_cron + Resend).
- Botón **Agregar a Google Calendar** en cada pedido, para recibir la alerta del celular aunque la app esté cerrada.

## 🧁 Producción, inventario, app y respaldo
- **Producción y compras** (`/dashboard/produccion`): con los pedidos activos del periodo calcula qué hornear por día y la lista de compras (descontando tu existencia), con paquetes y costo estimado. Se comparte por WhatsApp, se imprime o se descarga en CSV.
- **Inventario** (Ingredientes → Control de inventario): registra compras, ajustes y mermas; al marcar un pedido como **Entregado** se descuentan solos sus ingredientes y empaques (y se devuelven si regresas el estado). Avisos de stock bajo en el inicio.
- **App instalable + notificaciones push**: Ajustes → App y notificaciones. Avisa al instante de pedidos nuevos de la tienda y del resumen diario de entregas, aunque la app esté cerrada. Requiere `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT` (genera las tuyas con `npx web-push generate-vapid-keys`) y `SUPABASE_SERVICE_ROLE_KEY`.
- **Mensajes** (`/dashboard/mensajes`): plantillas de WhatsApp y correo editables con variables como `{cliente}`, `{folio}`, `{total}`, `{saldo}`.
- **Respaldo** (`/dashboard/respaldo`): Excel completo con una hoja por tema y respaldo técnico JSON.

## 🎁 Cuenta demo y tutorial
- En `/demo` cualquier persona entra a una **repostería de ejemplo** sin registrarse: 30 recetas costeadas, clientes, pedidos, cotizaciones, inventario y tienda. Dura **48 horas** y luego se borra sola (el cron de cada hora la elimina).
- Cada visitante tiene su **propia copia**: nadie ve ni modifica lo de otra persona.
- En la demo no se envían correos ni se suben fotos; hay una franja con el botón **«Quiero mi licencia»** (WhatsApp de ventas en `src/lib/legal.ts`).
- **Activar:** Supabase → Authentication → Sign In / Providers → **Allow anonymous sign-ins** = ON. Recomendado también activar CAPTCHA (Turnstile) para evitar abusos.
- **Tutorial** (`/dashboard/tutorial`): bienvenida en carrusel + 9 pasos que se palomean solos al visitar cada sección. Disponible para todas las usuarias.

## 🔑 Cómo generar licencias
1. Entra con tu cuenta de administradora → menú **Administración → Licencias**.
2. **Generar licencias** → plan (Básico, Profesional o Premium), periodo (mensual o anual), precio cobrado, cantidad y nota. Los códigos se copian al portapapeles.
3. Envía el código a tu clienta: se registra en `/registro` con él. La vigencia mensual/anual **empieza a contar cuando lo activa**.
4. Desde el mismo panel puedes **cambiar de plan**, **renovar** (suma un mes o un año y registra el pago), **suspender**, **reactivar** o **liberar el dispositivo**.
5. **Administración → Métricas**: licencias activas, por vencer (con botón para recordarles por WhatsApp), nuevas del mes, ingresos y demos.

## 💎 Planes
Los precios, nombres y lo que incluye cada plan se editan en `src/lib/plans.ts` (la página principal, los candados del menú y el panel de licencias leen de ahí).
- **Básico:** costeo, cotizaciones, pedidos con pagos parciales, calendario, clientes, reportes y respaldo.
- **Profesional:** + minitienda (variantes, galería, zonas, cupo diario, QR), seguimiento de cotizaciones, saldos, producción, inventario, plantillas y notificaciones.
- **Premium:** + alerta de margen, correos con logo y colores propios, recordatorio de saldo por correo a clientes y resumen diario por correo.
Ya no se venden licencias de por vida; las que ya existían quedan como **Premium sin vencimiento**.

## 📣 Página principal
- **Video:** graba un recorrido de 60–90 s, súbelo a YouTube como "No listado" y pega el ID en `src/lib/marketing.ts` (`DEMO_VIDEO_ID`).
- **Testimonios:** agrega en `src/lib/marketing.ts` solo opiniones reales y con permiso de tus clientas; mientras la lista esté vacía, la sección no aparece.
- **Preguntas frecuentes** y **botón de WhatsApp** (usa `SALES_WHATSAPP` de `src/lib/legal.ts`).
- Al compartir el enlace de una tienda se genera una tarjeta con su logo y la foto de un postre destacado. Las fotos nuevas se guardan en JPEG para que se vean en WhatsApp; si un postre se subió antes, vuelve a subir su foto.

Por SQL (alternativa): `select code from public.licenses where status = 'disponible';` para ver las disponibles, o
`insert into public.licenses (code, notes) values (public.generate_license_code(), 'Clienta X') returning code;` para crear una.

## 🧮 Fórmula de costeo (igual que tus hojas de Excel)

```
Costo fijo/hora   = Σ gastos fijos mensuales ÷ días al mes ÷ horas al día
Total CF          = costo fijo/hora × horas de trabajo de la receta
Total CV          = Σ (costo unitario × cantidad) de ingredientes
Desgaste          = (CF + CV) × % desgaste
Total costos      = CF + CV + desgaste
Ganancia          = Total costos × % ganancia
Subtotal          = Total costos + ganancia + empaquetado + envío
IVA (opcional)    = Subtotal × % IVA
Tarjeta (opcional)= (Subtotal + IVA) × % comisión
Precio por pieza  = (Subtotal + IVA + comisión) ÷ rendimiento
```
> Nota: en la hoja de cupcakes la comisión de tarjeta se calculaba como `((Subtotal+IVA)/12) × 5%`. En la app se aplica como porcentaje directo sobre el total, que es como cobra la terminal.

---

## 🔐 Seguridad
- **Sin inyección SQL:** todas las consultas pasan por la API de Supabase con parámetros; las funciones SQL no arman consultas con texto del usuario.
- **Row Level Security** en todas las tablas: cada usuaria solo ve sus propios datos, y los triggers impiden ligar registros a datos de otra cuenta o cambiar el dueño de un registro.
- **Licencias aleatorias** de 16 caracteres (~80 bits, sin consecutivos) con límite de 10 intentos por IP cada 15 min.
- **Enlaces de cotización** con token secreto aleatorio (UUID v4, 122 bits). El folio (C-0001) nunca da acceso; se puede desactivar o regenerar el enlace. Cada PDF lleva folio + código de verificación.
- **Límites anti-spam:** pedidos de la tienda (6 por IP cada 10 min), aceptación de cotizaciones, correos (40 por hora por usuaria).
- **Cabeceras de seguridad:** CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy; páginas privadas sin caché ni indexación.
- **APIs:** verificación de sesión, de origen (anti-CSRF), validación de correo/asunto/adjunto y redirecciones solo internas.
- **Storage:** solo imágenes de hasta 5 MB, cada usuaria escribe únicamente en su carpeta.
- Recomendado en Supabase → Authentication: activar *Leaked password protection* y *CAPTCHA* (Turnstile) para el registro.
- Las páginas públicas (tienda y cotización compartida) usan funciones `security definer` que exponen solo lo necesario; los precios de la tienda se calculan en el servidor.
- Un usuario no puede cambiar su propio rol ni su licencia.
- La sesión del dispositivo se guarda en una cookie `httpOnly` y se valida en el middleware y cada minuto en el panel.

## 📁 Estructura
```
src/
  app/
    page.tsx                 Landing
    (auth)/                  login, registro, activar, sesión activa, recuperar
    dashboard/               Panel (inicio, cotizaciones, pedidos, clientes, postres,
                             ingredientes, costos-fijos, reportes, tienda, ajustes, admin)
    tienda/[slug]/           Minitienda pública
    c/[token]/               Cotización pública
    api/                     session (claim/release/status), email
  components/               ui · layout · dashboard · pdf · store
  lib/                       costing, totals, sales, pdf, format, supabase
supabase/
  migrations/                Esquema, RLS, RPCs y datos iniciales
```
