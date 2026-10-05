import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Aviso de privacidad" };

const mail = <a href={`mailto:${LEGAL.email}`} className="font-semibold text-rose-500 hover:underline">{LEGAL.email}</a>;

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Tus datos, cuidados con cariño"
      title="Aviso de privacidad integral"
      intro={
        <p>
          En <strong>{LEGAL.brand}</strong> respetamos tu privacidad. Este aviso explica qué datos personales tratamos, para qué los usamos y cómo
          puedes ejercer tus derechos, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (publicada en el
          Diario Oficial de la Federación el 20 de marzo de 2025) y demás normativa aplicable en México.
        </p>
      }
      sections={[
        {
          title: "Responsable del tratamiento",
          body: (
            <>
              <p>
                <strong>{LEGAL.owner}</strong>, quien opera la plataforma <strong>{LEGAL.brand}</strong>, con domicilio en {LEGAL.address}, es
                responsable del tratamiento de tus datos personales.
              </p>
              <p>Contacto para temas de privacidad: {mail} · Tel. {LEGAL.phone}.</p>
            </>
          ),
        },
        {
          title: "Datos personales que tratamos",
          body: (
            <>
              <p><strong>De las usuarias de la plataforma (titulares de una licencia):</strong></p>
              <ul>
                <li>Identificación y contacto: nombre, nombre del negocio, correo electrónico, teléfono y WhatsApp.</li>
                <li>Datos del negocio que decidas capturar: domicilio, redes sociales (Instagram, Facebook), logotipo y datos para pago que quieras mostrar a tus clientes.</li>
                <li>Datos de la licencia y seguridad: código de licencia, tipo de navegador y sistema operativo del dispositivo activo, dirección IP y fecha de último acceso.</li>
              </ul>
              <p><strong>De los clientes de cada repostería</strong> (cuando compran en una minitienda o reciben una cotización):</p>
              <ul>
                <li>Nombre, teléfono o WhatsApp, correo electrónico, dirección de entrega, fecha del evento y notas del pedido.</li>
              </ul>
              <p>
                No solicitamos datos personales sensibles. Te pedimos no incluir información de salud u otros datos sensibles en las notas de los
                pedidos; si se mencionan alergias alimentarias, se usan únicamente para preparar el pedido.
              </p>
              <p>
                Los datos de los clientes de cada repostería los decide y administra la repostería correspondiente, quien es responsable frente a
                sus clientes; {LEGAL.brand} los trata por su cuenta, solo para prestarle el servicio.
              </p>
            </>
          ),
        },
        {
          title: "Finalidades",
          body: (
            <>
              <p><strong>Finalidades necesarias</strong> (son indispensables para el servicio):</p>
              <ul>
                <li>Crear y administrar tu cuenta, activar tu licencia y verificar que se use en un solo dispositivo a la vez.</li>
                <li>Guardar tus recetas, costos, clientes, cotizaciones, pedidos y reportes.</li>
                <li>Generar y enviar cotizaciones y notas de pedido en PDF por WhatsApp o correo, a solicitud de la usuaria.</li>
                <li>Recibir pedidos de la minitienda y comunicarlos a la repostería.</li>
                <li>Enviar avisos del servicio (recordatorios de entrega, seguridad, cambios en este aviso).</li>
                <li>Prevenir fraudes, abusos y accesos no autorizados.</li>
              </ul>
              <p><strong>Finalidades secundarias</strong> (puedes negarte sin afectar el servicio):</p>
              <ul>
                <li>Enviarte novedades, mejoras de la plataforma y promociones.</li>
              </ul>
              <p>Si no deseas que tus datos se usen para finalidades secundarias, escríbenos a {mail} con el asunto «No a finalidades secundarias».</p>
            </>
          ),
        },
        {
          title: "Remisiones y transferencias",
          body: (
            <>
              <p>Para operar la plataforma nos apoyamos en proveedores que tratan los datos únicamente por nuestra cuenta y bajo nuestras instrucciones:</p>
              <ul>
                <li><strong>Supabase</strong>: base de datos, autenticación y almacenamiento de imágenes.</li>
                <li><strong>Vercel</strong>: alojamiento del sitio web.</li>
                <li><strong>Resend</strong>: envío de correos electrónicos.</li>
              </ul>
              <p>
                Estos proveedores pueden almacenar información en servidores fuera de México. Cuando decides compartir un documento por WhatsApp, el
                mensaje se envía mediante la aplicación de WhatsApp (Meta), bajo sus propios términos.
              </p>
              <p>No vendemos ni rentamos tus datos personales. Solo los compartiremos con autoridades cuando una ley o una orden competente lo exija.</p>
            </>
          ),
        },
        {
          title: "Derechos ARCO y revocación del consentimiento",
          body: (
            <>
              <p>
                Tienes derecho a <strong>Acceder</strong> a tus datos, <strong>Rectificarlos</strong>, <strong>Cancelarlos</strong> u{" "}
                <strong>Oponerte</strong> a su tratamiento, así como a revocar tu consentimiento. Para hacerlo, envía una solicitud a {mail} que incluya:
              </p>
              <ul>
                <li>Tu nombre y un medio para comunicarte la respuesta.</li>
                <li>Copia de una identificación oficial (o de la de tu representante y el documento que lo acredite).</li>
                <li>Una descripción clara de los datos y del derecho que quieres ejercer.</li>
                <li>Cualquier documento que facilite localizar tus datos.</li>
              </ul>
              <p>Te responderemos dentro de los plazos que establece la ley. Muchos datos puedes actualizarlos tú misma desde la sección «Ajustes» de tu panel.</p>
              <p>Si eres cliente de una repostería, puedes dirigir tu solicitud a esa repostería; nosotros le daremos el apoyo necesario para atenderla.</p>
            </>
          ),
        },
        {
          title: "Cómo limitar el uso o divulgación",
          body: <p>Puedes pedirnos dejar de recibir comunicaciones promocionales escribiendo a {mail}. Las comunicaciones necesarias del servicio no pueden desactivarse mientras tengas una cuenta activa.</p>,
        },
        {
          title: "Seguridad de la información",
          body: (
            <p>
              Aplicamos medidas administrativas, técnicas y físicas para proteger tus datos: conexiones cifradas (HTTPS), contraseñas cifradas,
              separación estricta de la información de cada cuenta, enlaces de cotización con tokens secretos que puedes desactivar, límites de
              intentos contra accesos automatizados y respaldos del proveedor de base de datos.
            </p>
          ),
        },
        {
          title: "Cookies y tecnologías similares",
          body: (
            <p>
              Usamos únicamente cookies y almacenamiento local necesarios para iniciar sesión, proteger tu licencia y recordar el carrito de compras.
              Consulta los detalles en nuestra{" "}
              <Link href="/politica-de-cookies" className="font-semibold text-rose-500 hover:underline">Política de cookies</Link>.
            </p>
          ),
        },
        {
          title: "Cambios a este aviso",
          body: <p>Podemos actualizar este aviso por cambios legales o del servicio. Publicaremos la versión vigente en esta página con su fecha de actualización y, si el cambio es relevante, te avisaremos por correo o dentro de la plataforma.</p>,
        },
        {
          title: "Autoridad",
          body: (
            <p>
              Si consideras que tu derecho a la protección de datos personales ha sido vulnerado, puedes acudir ante la autoridad competente en la
              materia, que conforme a la ley vigente es la Secretaría Anticorrupción y Buen Gobierno.
            </p>
          ),
        },
      ]}
    />
  );
}
