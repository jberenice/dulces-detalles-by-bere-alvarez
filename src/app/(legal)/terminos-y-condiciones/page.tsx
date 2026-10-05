import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Términos y condiciones" };

const mail = <a href={`mailto:${LEGAL.email}`} className="font-semibold text-rose-500 hover:underline">{LEGAL.email}</a>;

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Reglas claras, relaciones dulces"
      title="Términos y condiciones de uso"
      intro={
        <p>
          Estos términos regulan el uso de la plataforma <strong>{LEGAL.brand}</strong> (la «Plataforma»), operada por {LEGAL.owner}. Al crear una
          cuenta, activar una licencia o comprar en una minitienda aceptas estos términos y nuestro{" "}
          <Link href="/aviso-de-privacidad" className="font-semibold text-rose-500 hover:underline">Aviso de privacidad</Link>.
        </p>
      }
      sections={[
        {
          title: "Qué ofrece la Plataforma",
          body: (
            <p>
              Herramientas en línea para reposterías: costeo de recetas, registro de ingredientes y gastos fijos, clientes, cotizaciones y notas de
              pedido en PDF, envío por WhatsApp y correo, reportes de ventas, calendario de entregas y una minitienda en línea por usuaria.
            </p>
          ),
        },
        {
          title: "Licencia de uso",
          body: (
            <ul>
              <li>Cada licencia es <strong>personal e intransferible</strong> y se liga a una sola cuenta.</li>
              <li>La licencia funciona en <strong>un dispositivo a la vez</strong>: al iniciar sesión en otro equipo, la sesión anterior se cierra.</li>
              <li>Los códigos de licencia son confidenciales; compartirlos, revenderlos o intentar adivinarlos está prohibido.</li>
              <li>La vigencia y condiciones comerciales de cada licencia (precio, duración, renovación) se acuerdan al adquirirla.</li>
              <li>Podemos suspender una licencia por falta de pago, uso indebido o incumplimiento de estos términos, avisándote cuando sea posible.</li>
            </ul>
          ),
        },
        {
          title: "Tu cuenta",
          body: (
            <ul>
              <li>Debes proporcionar información verdadera y mantenerla actualizada.</li>
              <li>Eres responsable de cuidar tu contraseña y de la actividad realizada con tu cuenta. Avísanos de inmediato si detectas un uso no autorizado.</li>
              <li>Debes ser mayor de edad y contar con capacidad legal para contratar.</li>
            </ul>
          ),
        },
        {
          title: "Uso permitido",
          body: (
            <>
              <p>Te comprometes a no:</p>
              <ul>
                <li>Usar la Plataforma para actividades ilícitas, engañosas o para enviar mensajes no solicitados (spam).</li>
                <li>Intentar acceder a cuentas, datos o documentos de otras personas, ni vulnerar o probar la seguridad del sistema sin autorización.</li>
                <li>Copiar, descompilar, revender o explotar la Plataforma o su diseño sin permiso por escrito.</li>
                <li>Subir contenido que infrinja derechos de terceros o que sea ofensivo.</li>
              </ul>
            </>
          ),
        },
        {
          title: "Tu información y contenido",
          body: (
            <>
              <p>
                Tus recetas, costos, fotografías, clientes y documentos son tuyos. Nos autorizas a almacenarlos y procesarlos solo para prestarte el
                servicio. Puedes solicitar una copia o la eliminación de tu información escribiendo a {mail}.
              </p>
              <p>
                Respecto de los datos de tus clientes, tú eres la responsable de informarles y de usarlos de forma lícita; la Plataforma los trata por tu
                cuenta.
              </p>
            </>
          ),
        },
        {
          title: "Cálculos de costos y precios",
          body: (
            <p>
              Los costos, márgenes y precios sugeridos se calculan con la información que tú capturas. Son una herramienta de apoyo y no constituyen
              asesoría contable, fiscal ni financiera. Revisa tus precios antes de cotizar; la decisión final de venta es tuya.
            </p>
          ),
        },
        {
          title: "Minitiendas y compras de clientes finales",
          body: (
            <>
              <p>
                Cada minitienda pertenece a la repostería que la publica. La compraventa de postres, el precio, la disponibilidad, la entrega, los
                pagos, las devoluciones y la calidad de los productos son responsabilidad exclusiva de esa repostería frente a su cliente.
              </p>
              <p>
                Los pedidos realizados en una minitienda son solicitudes que la repostería confirmará por WhatsApp. La Plataforma no procesa pagos.
                Los clientes conservan los derechos que les otorga la Ley Federal de Protección al Consumidor y pueden acudir a la Procuraduría
                Federal del Consumidor (Profeco).
              </p>
            </>
          ),
        },
        {
          title: "Disponibilidad y cambios del servicio",
          body: (
            <p>
              Trabajamos para que la Plataforma esté disponible y segura, pero puede haber interrupciones por mantenimiento o causas ajenas a nosotros.
              Podemos mejorar, modificar o retirar funciones, procurando no afectar tu información.
            </p>
          ),
        },
        {
          title: "Propiedad intelectual",
          body: (
            <p>
              La marca {LEGAL.brand}, su logotipo, diseño, código y contenidos de la Plataforma son propiedad de su titular y están protegidos por la
              ley. La licencia no te transfiere ningún derecho sobre ellos, salvo el de uso conforme a estos términos.
            </p>
          ),
        },
        {
          title: "Limitación de responsabilidad",
          body: (
            <p>
              En la medida que lo permita la ley, no seremos responsables por pérdidas derivadas de datos capturados de forma incorrecta, decisiones
              comerciales tomadas con base en los cálculos, fallas de servicios de terceros (internet, WhatsApp, correo) o del uso indebido de tu cuenta.
            </p>
          ),
        },
        {
          title: "Terminación",
          body: <p>Puedes dejar de usar la Plataforma en cualquier momento. Al terminar, podrás solicitar una copia de tu información dentro de los 30 días siguientes; después podremos eliminarla de forma segura.</p>,
        },
        {
          title: "Cambios a estos términos",
          body: <p>Podemos actualizar estos términos. La versión vigente estará siempre en esta página; si el cambio es importante te avisaremos con anticipación. Seguir usando la Plataforma implica que aceptas la versión actualizada.</p>,
        },
        {
          title: "Ley aplicable y contacto",
          body: (
            <p>
              Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia se resolverá ante los tribunales
              competentes del domicilio del responsable, salvo que la ley disponga otra cosa. Dudas o aclaraciones: {mail}.
            </p>
          ),
        },
      ]}
    />
  );
}
