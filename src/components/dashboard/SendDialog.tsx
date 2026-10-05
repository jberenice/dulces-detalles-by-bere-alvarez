"use client";
import { useEffect, useState } from "react";
import { Download, Mail, MessageCircle, Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { Tabs } from "@/components/ui/Tabs";
import { blobToBase64, downloadBlob, shareViaWhatsApp } from "@/lib/pdf";

export function SendDialog({
  open,
  onClose,
  getPdf,
  phone,
  email,
  whatsappText,
  emailSubject,
  emailText,
  link,
  onSent,
  initialTab = "whatsapp",
}: {
  open: boolean;
  onClose: () => void;
  getPdf: () => Promise<{ blob: Blob; filename: string }>;
  phone?: string | null;
  email?: string | null;
  whatsappText: string;
  emailSubject: string;
  emailText: string;
  link?: string;
  onSent?: (via: "whatsapp" | "email") => void;
  initialTab?: "whatsapp" | "email";
}) {
  const [tab, setTab] = useState<"whatsapp" | "email">("whatsapp");
  const [to, setTo] = useState(email ?? "");
  const [wa, setWa] = useState(phone ?? "");
  const [waText, setWaText] = useState(whatsappText);
  const [subject, setSubject] = useState(emailSubject);
  const [msg, setMsg] = useState(emailText);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setTo(email ?? "");
      setWa(phone ?? "");
      setWaText(whatsappText);
      setSubject(emailSubject);
      setMsg(emailText);
    }
  }, [open, email, phone, whatsappText, emailSubject, emailText, initialTab]);

  async function sendWhatsApp() {
    setBusy(true);
    try {
      const { blob, filename } = await getPdf();
      const r = await shareViaWhatsApp({ blob, filename, phone: wa, text: waText });
      if (r !== "cancelled") {
        if (r === "link") toast.success("Abrimos WhatsApp y descargamos el PDF para que lo adjuntes");
        onSent?.("whatsapp");
        onClose();
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function sendEmail() {
    if (!to) return toast.error("Escribe el correo del cliente");
    setBusy(true);
    try {
      const { blob, filename } = await getPdf();
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, message: msg, filename, pdfBase64: await blobToBase64(blob) }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Enviado a ${to} 💌`);
        onSent?.("email");
        onClose();
      } else if (data.reason === "not_configured") {
        downloadBlob(blob, filename);
        window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg + (link ? `\n\n${link}` : ""))}`;
        toast.info("Abrimos tu correo y descargamos el PDF para adjuntarlo (configura Resend para envío automático).");
        onSent?.("email");
        onClose();
      } else {
        toast.error(data.error ?? "No se pudo enviar");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  /** Menú nativo de compartir (celular): adjunta el PDF; si no está disponible, copia el enlace o descarga */
  async function share() {
    setBusy(true);
    try {
      const { blob, filename } = await getPdf();
      const file = new File([blob], filename, { type: "application/pdf" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: emailSubject, text: link ?? undefined }).catch(() => {});
      } else if (link && navigator.share) {
        await navigator.share({ title: emailSubject, url: link }).catch(() => {});
      } else if (link) {
        await navigator.clipboard.writeText(link);
        toast.success("Enlace copiado para compartir");
      } else {
        downloadBlob(blob, filename);
      }
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    setBusy(true);
    try {
      const { blob, filename } = await getPdf();
      downloadBlob(blob, filename);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Enviar al cliente"
      description="El PDF se genera con tu logo y colores."
      footer={
        <>
          <div className="flex gap-1 sm:mr-auto">
            <Button variant="ghost" onClick={download} disabled={busy}>
              <Download className="h-4 w-4" /> Descargar
            </Button>
            <Button variant="ghost" onClick={share} disabled={busy}>
              <Share2 className="h-4 w-4" /> Compartir
            </Button>
          </div>
          {tab === "whatsapp" ? (
            <Button variant="mint" onClick={sendWhatsApp} loading={busy}>
              <MessageCircle className="h-4 w-4" /> Enviar por WhatsApp
            </Button>
          ) : (
            <Button onClick={sendEmail} loading={busy}>
              <Mail className="h-4 w-4" /> Enviar correo
            </Button>
          )}
        </>
      }
    >
      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-5 w-full"
        options={[
          { value: "whatsapp", label: <><MessageCircle className="h-4 w-4" /> WhatsApp</> },
          { value: "email", label: <><Mail className="h-4 w-4" /> Correo</> },
        ]}
      />
      {tab === "whatsapp" ? (
        <div className="space-y-4">
          <Input label="WhatsApp del cliente" type="tel" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="998 123 4567" hint="Si son 10 dígitos agregamos la lada de México (52)." />
          <Textarea label="Mensaje" rows={6} value={waText} onChange={(e) => setWaText(e.target.value)} />
          <p className="rounded-2xl bg-mint-50 p-3 text-xs text-mint-700">
            En el celular se abre el menú para compartir y el PDF se adjunta directo al chat. En computadora abrimos WhatsApp Web con el mensaje y
            descargamos el PDF para que lo arrastres.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <Input label="Correo del cliente" type="email" value={to} onChange={(e) => setTo(e.target.value)} />
          <Input label="Asunto" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Textarea label="Mensaje" rows={6} value={msg} onChange={(e) => setMsg(e.target.value)} />
        </div>
      )}
      {link && (
        <button
          onClick={() => navigator.clipboard.writeText(link).then(() => toast.success("Enlace copiado"))}
          className="mt-4 flex w-full items-center gap-2 rounded-2xl border border-dashed border-cocoa-800/10 px-4 py-3 text-left text-xs text-cocoa-500 hover:border-rose-300"
        >
          <Link2 className="h-4 w-4 shrink-0 text-rose-400" /> <span className="truncate">{link}</span>
          <span className="ml-auto font-bold text-rose-500">Copiar</span>
        </button>
      )}
    </Modal>
  );
}
