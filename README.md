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

### 5. Deploy en Vercel
1. Sube el proyecto a GitHub.
2. En Vercel → *New Project* → importa el repo (Framework: Next.js).
3. Agrega las mismas variables de entorno y despliega.
4. Actualiza la *Site URL* de Supabase con tu dominio final.

---

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
