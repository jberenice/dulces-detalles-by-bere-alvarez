"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/client";
import { folio, money } from "@/lib/format";

export const PAYMENT_METHODS = ["Efectivo", "Transferencia", "Tarjeta", "Depósito", "Otro"];

/** Registra un pago parcial (o la liquidación) de un pedido */
export function PaymentModal({
  order,
  onClose,
  onSaved,
}: {
  order: { id: string; folio: number; total: number; deposit: number; customer?: string | null } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const balance = order ? Math.max(Number(order.total) - Number(order.deposit), 0) : 0;
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState("Transferencia");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  // Se reinicia solo al abrir (o cambiar de pedido), no en cada render del padre
  const orderId = order?.id;
  useEffect(() => {
    if (orderId) {
      setAmount(balance ? String(Math.round(balance * 100) / 100) : "");
      setNote("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function save() {
    const value = Number(amount);
    if (!order || !(value > 0)) return toast.error("Escribe un monto mayor a cero");
    setBusy(true);
    const { error } = await createClient().from("order_payments").insert({ order_id: order.id, amount: value, method, note: note.trim() || null });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(value >= balance ? "¡Pedido liquidado! ✨" : `Pago de ${money(value)} registrado 💰`);
    onSaved();
    onClose();
  }

  return (
    <Modal
      open={!!order}
      onClose={onClose}
      title={order ? `Registrar pago · ${folio("P", order.folio)}` : ""}
      description={order ? `${order.customer ? order.customer + " · " : ""}Saldo pendiente: ${money(balance)}` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="mint" onClick={save} loading={busy}>
            Registrar pago
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Monto" type="number" inputMode="decimal" min={0} step="any" prefix="$" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        <div className="flex flex-wrap gap-2">
          {[0.5, 1].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setAmount(String(Math.round(balance * f * 100) / 100))}
              className="rounded-full bg-cream-200 px-3 py-1 text-xs font-bold text-cocoa-500 hover:bg-cream-300"
            >
              {f === 1 ? "Todo el saldo" : "La mitad"}
            </button>
          ))}
        </div>
        <Select label="Forma de pago" value={method} onChange={(e) => setMethod(e.target.value)}>
          {PAYMENT_METHODS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </Select>
        <Input label="Nota (opcional)" placeholder="Ej. Transferencia BBVA" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Modal>
  );
}
