import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold",
  {
    variants: {
      variant: {
        default: "bg-[var(--success-bg)] text-[var(--success)]",
        warning: "bg-[var(--warning-bg)] text-[var(--warning)]",
        danger: "bg-[var(--danger-bg)] text-[var(--danger)]",
        muted: "bg-[var(--surface-elevated)] text-[var(--foreground-muted)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
