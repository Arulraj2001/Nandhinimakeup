import Link from "next/link";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";

interface FloatingWhatsAppProps {
  phoneNumber?: string;
  businessName?: string;
}

export function FloatingWhatsApp({
  phoneNumber,
  businessName,
}: FloatingWhatsAppProps) {
  if (!phoneNumber) return null;

  const href = buildWhatsAppLink({
    phoneNumber,
    greeting: `Hello ${businessName || ""}! I would like to enquire about your services and products.`,
  });

  if (!href) return null;

  return (
    <aside
      aria-label="Direct WhatsApp Contact"
      className="fixed right-6 bottom-6 z-40"
    >
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-foreground group flex h-13 w-13 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95"
      >
        {/* Native inline SVG WhatsApp icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 fill-current"
          aria-hidden="true"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </Link>
    </aside>
  );
}
