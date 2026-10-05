"use client";
import { useState } from "react";
import { DatabaseBackup, FileJson, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { exportExcel, exportJson } from "@/lib/backup";
import { downloadBlob } from "@/lib/pdf";
import { toISODate } from "@/lib/format";
import { useBusiness } from "@/components/layout/BusinessProvider";

export default function BackupPage() {
  const { profile } = useBusiness();
  const [busy, setBusy] = useState<"excel" | "json" | null>(null);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const base = `respaldo-${(profile.store_slug || "dulces-detalles").slice(0, 30)}-${toISODate(new Date())}`;

  async function excel() {
    setBusy("excel");
    try {
      const { blob, counts } = await exportExcel();
      downloadBlob(blob, `${base}.xlsx`);
      setCounts(counts);
      toast.success("Respaldo en Excel descargado 📊");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function json() {
    setBusy("json");
    try {
      downloadBlob(await exportJson(), `${base}.json`);
      toast.success("Respaldo técnico descargado");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Tu información, siempre tuya" title="Respaldo y exportación" subtitle="Descarga toda tu información con un clic. Te recomendamos hacerlo una vez al mes y guardarlo en tu Drive o computadora." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col p-6">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-mint-50 text-mint-600"><FileSpreadsheet className="h-7 w-7" /></span>
          <h3 className="mt-4 text-xl font-semibold">Excel completo</h3>
          <p className="mt-1 text-sm text-cocoa-500">
            Un archivo .xlsx con una hoja para cada cosa: pedidos y sus postres, cotizaciones, clientes, postres, recetas, ingredientes, gastos fijos, movimientos de inventario y los datos de tu negocio. Con filtros y formato de moneda listos.
          </p>
          <Button className="mt-auto w-full" size="lg" variant="mint" onClick={excel} loading={busy === "excel"} disabled={!!busy}>
            <FileSpreadsheet className="h-5 w-5" /> Descargar Excel
          </Button>
          {counts && (
            <ul className="mt-4 grid grid-cols-2 gap-1 text-xs text-cocoa-500">
              {Object.entries(counts).map(([k, v]) => (
                <li key={k} className="flex justify-between rounded-lg bg-cream-100 px-2.5 py-1.5"><span>{k}</span><b>{v}</b></li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="flex flex-col p-6">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cream-200 text-cocoa-500"><FileJson className="h-7 w-7" /></span>
          <h3 className="mt-4 text-xl font-semibold">Respaldo técnico (JSON)</h3>
          <p className="mt-1 text-sm text-cocoa-500">Copia exacta de todos tus registros con todas sus columnas. Sirve para restaurar tu información o migrarla a otro sistema.</p>
          <Button className="mt-auto w-full" size="lg" variant="outline" onClick={json} loading={busy === "json"} disabled={!!busy}>
            <DatabaseBackup className="h-5 w-5" /> Descargar JSON
          </Button>
        </Card>
      </div>
      <p className="mt-6 flex items-start gap-2 rounded-2xl bg-cream-100 p-4 text-sm text-cocoa-500">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-mint-500" />
        El archivo se genera en tu navegador solo con tu información. Contiene datos personales de tus clientes: guárdalo en un lugar seguro y no lo compartas.
      </p>
    </>
  );
}
