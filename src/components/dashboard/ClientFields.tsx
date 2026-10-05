"use client";
import { Input, Textarea } from "@/components/ui/Field";

export const blankClient = { id: "", name: "", phone: "", email: "", address: "", birthday: "", notes: "" };
type ClientForm = typeof blankClient;

export function ClientFields({ form, setForm }: { form: ClientForm; setForm: (f: ClientForm) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input className="sm:col-span-2" label="Nombre completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
      <Input label="WhatsApp / teléfono" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="998 123 4567" />
      <Input label="Correo" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <Input className="sm:col-span-2" label="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      <Input label="Cumpleaños" type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
      <Textarea className="sm:col-span-2" label="Notas" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Alergias, preferencias, fechas especiales…" />
    </div>
  );
}
