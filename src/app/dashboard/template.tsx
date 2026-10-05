/**
 * Transición suave al cambiar de sección del panel.
 * Solo opacidad (sin transform) para no afectar barras fijas ni elementos "sticky" de las páginas.
 */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in">{children}</div>;
}
