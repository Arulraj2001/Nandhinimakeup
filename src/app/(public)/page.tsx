import { siteConfig } from "@/lib/config/site";

export default function HomePage() {
  return (
    <section className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-heading text-foreground text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
          {siteConfig.name}
        </h1>
        <p className="text-foreground mt-6 text-lg leading-8">
          {siteConfig.shortDescription}
        </p>
        <div className="border-border bg-card-surface text-foreground mt-8 rounded-lg border px-4 py-3 text-sm">
          <p>
            Note: This is a temporary foundation view. The full public homepage
            will be built in Phase 3.
          </p>
        </div>
      </div>
    </section>
  );
}
