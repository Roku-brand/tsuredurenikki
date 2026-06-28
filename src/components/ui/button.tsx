import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import Link from "next/link";
import { clsx } from "clsx";

const variants = {
  primary: "bg-lake text-white hover:bg-lake/90",
  secondary: "bg-mist text-ink hover:bg-mist/80 dark:bg-white/10 dark:text-white",
  ghost: "bg-transparent text-ink hover:bg-black/5 dark:text-white dark:hover:bg-white/10",
  danger: "bg-red-600 text-white hover:bg-red-700"
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base"
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-55",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function ButtonLink({ className, variant = "primary", size = "md", href, ...props }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={clsx(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-lg font-medium transition",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
