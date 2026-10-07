import { siteConfig } from "@/lib/config/site";

export function Footer() {
  const currentYear = 2026;

  return (
    <footer className="border-border bg-page-background border-t py-6">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-foreground text-sm">
          © {currentYear} {siteConfig.name}
        </p>
      </div>
    </footer>
  );
}
