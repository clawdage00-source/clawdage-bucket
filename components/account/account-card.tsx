import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Consistent account-area card chrome (spacing, borders, radius). */
export function AccountCard({ className, ...props }: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden rounded-2xl border border-border bg-card py-0 text-card-foreground shadow-sm ring-0",
        className,
      )}
      {...props}
    />
  );
}

export function AccountCardHeader({ className, ...props }: React.ComponentProps<typeof CardHeader>) {
  return (
    <CardHeader
      className={cn(
        "flex flex-col gap-3 border-b border-border px-5 py-5 sm:px-6 sm:py-6",
        className,
      )}
      {...props}
    />
  );
}

export function AccountCardContent({ className, ...props }: React.ComponentProps<typeof CardContent>) {
  return (
    <CardContent className={cn("px-5 py-5 sm:px-6 sm:py-6", className)} {...props} />
  );
}

export function AccountCardLabel({
  icon: Icon,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </span>
    </div>
  );
}

export function AccountSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-5", className)}>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function AccountPanel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-muted px-5 py-6 sm:px-6 sm:py-7",
        className,
      )}
    >
      <div className="space-y-1.5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
        {description ? (
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export { CardDescription, CardTitle };
