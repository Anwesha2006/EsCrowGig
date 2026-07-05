import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  isLoading?: boolean;
  icon?: ReactNode;
};

const variants = {
  primary: "bg-ink text-white hover:bg-slate-700",
  secondary: "bg-white text-ink ring-1 ring-slate-200 hover:bg-slate-50",
  danger: "bg-coral text-white hover:bg-red-600",
  ghost: "bg-transparent text-ink hover:bg-slate-100"
};

export const Button = ({
  variant = "primary",
  isLoading,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) => (
  <button
    className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`}
    disabled={disabled || isLoading}
    {...props}
  >
    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
    <span>{children}</span>
  </button>
);

