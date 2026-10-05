import Link from "next/link";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "mint" | "ghost" | "outline" | "danger" | "dark";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-rose-500 text-white shadow-rose hover:bg-rose-600 active:bg-rose-700",
  secondary: "bg-cream-200 text-cocoa-700 hover:bg-cream-300",
  mint: "bg-mint-500 text-white hover:bg-mint-600 shadow-[0_10px_24px_-12px_rgb(106_166_138/0.8)]",
  ghost: "text-cocoa-600 hover:bg-cocoa-800/5",
  outline: "border border-cocoa-800/12 bg-white text-cocoa-700 hover:border-rose-300 hover:text-rose-600",
  danger: "bg-white border border-rose-200 text-rose-600 hover:bg-rose-50",
  dark: "bg-cocoa-800 text-cream-100 hover:bg-cocoa-900",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5 rounded-xl",
  md: "h-11 px-5 text-sm gap-2 rounded-2xl",
  lg: "h-13 px-7 text-[15px] gap-2.5 rounded-2xl",
  icon: "h-10 w-10 rounded-xl justify-center",
};

type CommonProps = { variant?: Variant; size?: Size; loading?: boolean; className?: string };

export const buttonClass = (variant: Variant = "primary", size: Size = "md", className?: string) =>
  cn(
    "inline-flex items-center justify-center font-bold whitespace-nowrap transition-all duration-200 select-none",
    "disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    variants[variant],
    sizes[size],
    className,
  );

export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & CommonProps>(
  function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...props }, ref) {
    return (
      <button ref={ref} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...props}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & CommonProps & { href: string }) {
  const external = href.startsWith("http") || href.startsWith("mailto:");
  if (external)
    return (
      <a href={href} className={buttonClass(variant, size, className)} target="_blank" rel="noreferrer" {...props}>
        {children}
      </a>
    );
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
