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
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#FFF5F5] px-4 py-16 text-center text-[#4A4A4A]">
        <div className="mx-auto max-w-md rounded-xl border border-[#E2B4BD] bg-[#F7D6D0] p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-[#4A4A4A]">
            Critical Error
          </h1>
          <p className="mt-4 text-sm text-[#4A4A4A]">
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
