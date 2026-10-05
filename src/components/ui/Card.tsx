import { cn } from "@/lib/cn";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6", className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-500">{icon}</span>
        )}
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {subtitle && <p className="text-[13px] text-cocoa-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: "neutral" | "info" | "success" | "danger" | "warning" | "rose" | "mint";
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: "bg-cocoa-800/6 text-cocoa-600",
    info: "bg-sky-50 text-sky-700 ring-sky-200/60",
    success: "bg-mint-50 text-mint-700 ring-mint-200",
    danger: "bg-rose-50 text-rose-700 ring-rose-200",
    warning: "bg-amber-50 text-amber-700 ring-amber-200/70",
    rose: "bg-rose-100 text-rose-700 ring-rose-200",
    mint: "bg-mint-100 text-mint-700 ring-mint-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide whitespace-nowrap ring-1 ring-transparent ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="animate-fade-up">
        {eyebrow && <p className="mb-1 font-script text-xl text-rose-500">{eyebrow}</p>}
        <h1 className="text-[28px] leading-tight font-semibold sm:text-[34px]">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-[15px] text-cocoa-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "rose",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "rose" | "mint" | "cocoa" | "cream";
}) {
  const tones = {
    rose: "bg-rose-50 text-rose-500",
    mint: "bg-mint-50 text-mint-600",
    cocoa: "bg-cocoa-800/5 text-cocoa-600",
    cream: "bg-cream-200 text-cocoa-500",
  };
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-bold tracking-wider text-cocoa-400 uppercase">{label}</p>
          <p className="mt-2 truncate font-display text-[26px] leading-none font-semibold text-cocoa-800 tabular-nums">{value}</p>
          {hint && <p className="mt-2 text-xs text-cocoa-400">{hint}</p>}
        </div>
        {icon && <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", tones[tone])}>{icon}</span>}
      </div>
    </Card>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="sprinkles mb-4 grid h-20 w-20 place-items-center rounded-full bg-cream-200 text-rose-400">{icon}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-cocoa-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-cocoa-800/6", className)} />;
}
