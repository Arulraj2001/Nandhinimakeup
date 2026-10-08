import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="bg-page-background text-foreground flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="border-border bg-card-surface mx-auto max-w-md rounded-xl border p-8 shadow-sm sm:p-10">
        <p className="text-foreground text-sm font-semibold tracking-wider uppercase">
          404 Error
        </p>
        <h1 className="font-heading text-foreground mt-2 text-3xl font-semibold sm:text-4xl">
          Page Not Found
        </h1>
        <p className="text-foreground mt-4 text-sm">
          The page you are looking for does not exist or may have been moved.
        </p>
        <div className="mt-6">
          <Button asChild variant="default">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
