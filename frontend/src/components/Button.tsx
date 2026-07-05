import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  isLoading?: boolean;
  icon?: ReactNode;
};

const variants = {
  primary: "bg-primary text-white shadow-button hover:bg-primary-dark",
  secondary: "border-[1.5px] border-primary bg-white text-primary hover:bg-primary-light",
  danger: "bg-danger text-white hover:bg-red-600",
  ghost: "bg-transparent text-body hover:bg-primary-light hover:text-primary"
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
    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-7 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`}
    disabled={disabled || isLoading}
    {...props}
  >
    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
    <span>{children}</span>
  </button>
);
