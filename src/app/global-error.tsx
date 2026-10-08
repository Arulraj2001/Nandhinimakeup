"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-page-background text-foreground flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
        <div className="border-border bg-card-surface mx-auto max-w-md rounded-xl border p-8 shadow-sm">
          <h1 className="text-foreground text-3xl font-semibold">
            Critical Error
          </h1>
          <p className="text-foreground mt-4 text-sm">
            A critical error occurred. Please try reloading the page.
          </p>
          <div className="mt-6">
            <Button onClick={() => reset()} variant="default">
              Try again
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
