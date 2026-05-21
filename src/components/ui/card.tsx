import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-lg font-bold text-[var(--foreground)]", className)} {...props} />
);

const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-[var(--foreground-muted)]", className)} {...props} />
);

export { Card, CardTitle, CardDescription };
