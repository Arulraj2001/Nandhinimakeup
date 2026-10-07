import * as React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="border-border flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-heading text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-foreground/80 mt-1 text-sm">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}
