import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

type BaseProps = { label?: string; hint?: string; error?: string; className?: string };

export const Input = forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> & BaseProps & { prefix?: React.ReactNode; suffix?: React.ReactNode }
>(function Input({ label, hint, error, className, prefix, suffix, id, ...props }, ref) {
  const autoId = useId();
  const fid = id ?? autoId;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={fid} className="label">
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm text-cocoa-400">{prefix}</span>
        )}
        <input
          ref={ref}
          id={fid}
          className={cn("field", prefix ? "pl-9" : "", suffix ? "pr-12" : "", error && "border-rose-400")}
          {...props}
        />
        {suffix && (
          <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-cocoa-400">{suffix}</span>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-cocoa-400">{hint}</p>
      ) : null}
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & BaseProps>(
  function Textarea({ label, hint, className, id, ...props }, ref) {
    const autoId = useId();
    const fid = id ?? autoId;
    return (
      <div className={className}>
        {label && (
          <label htmlFor={fid} className="label">
            {label}
          </label>
        )}
        <textarea ref={ref} id={fid} className="field min-h-[96px] resize-y" {...props} />
        {hint && <p className="mt-1 text-xs text-cocoa-400">{hint}</p>}
      </div>
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & BaseProps>(
  function Select({ label, hint, className, id, children, ...props }, ref) {
    const autoId = useId();
    const fid = id ?? autoId;
    return (
      <div className={className}>
        {label && (
          <label htmlFor={fid} className="label">
            {label}
          </label>
        )}
        <div className="relative">
          <select ref={ref} id={fid} className="field appearance-none pr-10" {...props}>
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-cocoa-400" />
        </div>
        {hint && <p className="mt-1 text-xs text-cocoa-400">{hint}</p>}
      </div>
    );
  },
);

export function Toggle({
  checked,
  onChange,
  label,
  description,
  className,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
  className?: string;
}) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 select-none", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-mint-500" : "bg-cocoa-800/15",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5.5" : "translate-x-0.5",
          )}
        />
      </button>
      {(label || description) && (
        <span className="text-sm">
          {label && <span className="block font-semibold text-cocoa-700">{label}</span>}
          {description && <span className="block text-xs text-cocoa-400">{description}</span>}
        </span>
      )}
    </label>
  );
}
