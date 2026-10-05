"use client";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Combobox } from "@/components/ui/Combobox";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ClientFields, blankClient } from "./ClientFields";
import type { Client } from "@/lib/types";

export function ClientPicker({
  clients,
  value,
  onChange,
  onCreated,
}: {
  clients: Client[];
  value: string | null;
  onChange: (id: string) => void;
  onCreated: (c: Client) => void;
}) {
  const [form, setForm] = useState<typeof blankClient | null>(null);
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!form?.name.trim()) return toast.error("Escribe el nombre");
    setSaving(true);
    const { data, error } = await createClient()
      .from("clients")
      .insert({
        name: form.name.trim(),
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        birthday: form.birthday || null,
        notes: form.notes || null,
      })
      .select()
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    onCreated(data as Client);
    onChange(data.id);
    setForm(null);
  }

  return (
    <>
      <Combobox
        value={value}
        onChange={onChange}
        options={clients.map((c) => ({ value: c.id, label: c.name, hint: c.phone ?? undefined }))}
        placeholder="Busca o crea un cliente"
        onCreate={(text) => setForm({ ...blankClient, name: text })}
        createLabel="Nuevo cliente"
      />
      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title="Nuevo cliente"
        footer={
          <>
            <Button variant="ghost" onClick={() => setForm(null)}>Cancelar</Button>
            <Button onClick={create} loading={saving}>Guardar cliente</Button>
          </>
        }
      >
        {form && <ClientFields form={form} setForm={setForm} />}
      </Modal>
    </>
  );
}
