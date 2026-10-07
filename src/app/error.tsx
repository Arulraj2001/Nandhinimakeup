"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log error to console in development
    console.error(error);
  }, [error]);

  return (
    <div className="bg-page-background text-foreground flex min-h-[calc(100vh-140px)] flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="border-border bg-card-surface mx-auto max-w-md rounded-xl border p-8 shadow-sm sm:p-10">
        <p className="text-foreground text-sm font-semibold tracking-wider uppercase">
          Application Error
        </p>
        <h1 className="font-heading text-foreground mt-2 text-3xl font-semibold sm:text-4xl">
          Something went wrong
        </h1>
        <p className="text-foreground mt-4 text-sm">
          An unexpected error occurred while loading this page. Please try
          again.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Button onClick={() => reset()} variant="default">
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
