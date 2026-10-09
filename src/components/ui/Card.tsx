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
    <div className={cn("flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-4 pt-4 sm:px-6 sm:pt-6", className)}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-500 sm:h-10 sm:w-10">{icon}</span>
        )}
        <div className="min-w-0">
          <h3 className="text-base leading-snug font-semibold sm:text-lg">{title}</h3>
          {subtitle && <p className="text-[12.5px] text-cocoa-400 sm:text-[13px]">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
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
        {eyebrow && <p className="mb-1 text-xs font-bold tracking-[0.14em] text-rose-500 uppercase">{eyebrow}</p>}
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
    <Card className="relative overflow-hidden p-3.5 sm:p-5">
      {icon && (
        <span className={cn("absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-xl sm:top-5 sm:right-5 sm:h-11 sm:w-11 sm:rounded-2xl [&_svg]:h-4 [&_svg]:w-4 sm:[&_svg]:h-5 sm:[&_svg]:w-5", tones[tone])}>
          {icon}
        </span>
      )}
      <p className="pr-10 text-[10.5px] leading-tight font-bold tracking-wider text-cocoa-400 uppercase sm:pr-14 sm:text-[12px]">{label}</p>
      <p className="mt-2.5 font-display text-[21px] leading-none font-semibold break-words text-cocoa-800 tabular-nums sm:mt-3 sm:text-[26px]">{value}</p>
      {hint && <p className="mt-2 text-[11.5px] leading-snug text-cocoa-400 sm:text-xs">{hint}</p>}
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
  return <div aria-hidden className={cn("skeleton rounded-2xl", className)} />;
}
