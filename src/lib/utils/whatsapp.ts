import { formatINR } from "@/lib/utils/currency";

export interface BuildWhatsAppLinkOptions {
  phoneNumber: string;
  greeting?: string;
  itemName?: string;
  price?: string | number | null;
  pageUrl?: string;
  extraLines?: string[];
}

/**
 * Builds a valid WhatsApp click-to-chat URL with prefilled text.
 * Returns empty string if phone number is empty.
 * All WhatsApp links in the project must use this module.
 */
export function buildWhatsAppLink(options: BuildWhatsAppLinkOptions): string {
  if (!options.phoneNumber) {
    return "";
  }

  // Strip non-digit characters from phone number, keeping leading country code
  const cleanNumber = options.phoneNumber.replace(/[^\d]/g, "");
  if (!cleanNumber) {
    return "";
  }

  const lines: string[] = [];

  if (options.greeting) {
    lines.push(options.greeting);
  } else {
    lines.push("Hello! I would like to enquire about:");
  }

  if (options.itemName) {
    lines.push(`Item: ${options.itemName}`);
  }

  if (options.price !== undefined && options.price !== null) {
    const formattedPrice =
      typeof options.price === "number"
        ? formatINR(options.price)
        : options.price;
    lines.push(`Price: ${formattedPrice}`);
  }

  if (options.pageUrl) {
    lines.push(`Link: ${options.pageUrl}`);
  }

  if (options.extraLines && options.extraLines.length > 0) {
    for (const line of options.extraLines) {
      if (line.trim()) {
        lines.push(line.trim());
      }
    }
  }

  const messageText = lines.join("\n");
  const encodedText = encodeURIComponent(messageText);

  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}
