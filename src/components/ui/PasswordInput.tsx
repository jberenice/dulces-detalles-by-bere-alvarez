"use client";
import { forwardRef, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "./Field";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "prefix"> & { label?: string; hint?: string; error?: string };

/** Campo de contraseña con botón para mostrar u ocultar */
export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(props, ref) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} {...props} type={show ? "text" : "password"} prefix={<Lock className="h-4 w-4" />} className={`${props.className ?? ""} [&_input]:pr-12`} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className={`absolute right-2 grid h-9 w-9 place-items-center rounded-xl text-cocoa-400 transition hover:bg-cocoa-800/5 hover:text-rose-500 ${props.label ? "top-[30px]" : "top-1"}`}
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={show}
        tabIndex={0}
      >
        {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
      </button>
    </div>
  );
});
