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

export interface CartWhatsAppItem {
  name: string;
  quantity: number;
  price: number;
  lineTotal: number;
}

export interface BuildCartWhatsAppLinkOptions {
  phoneNumber?: string | null;
  businessName?: string;
  items: CartWhatsAppItem[];
  subtotal: number;
  deliveryCharge: number;
  isFreeDelivery: boolean;
  total: number;
  customerName?: string;
  customerPhone?: string;
  deliveryCity?: string;
  deliveryState?: string;
  orderNumber?: string;
  orderUrl?: string;
}

const NUMBER_BADGES = [
  "1️⃣",
  "2️⃣",
  "3️⃣",
  "4️⃣",
  "5️⃣",
  "6️⃣",
  "7️⃣",
  "8️⃣",
  "9️⃣",
  "🔟",
];

export function buildCartWhatsAppLink(
  options: BuildCartWhatsAppLinkOptions
): string {
  if (!options.phoneNumber || options.items.length === 0) {
    return "";
  }

  const cleanNumber = options.phoneNumber.replace(/[^\d]/g, "");
  if (!cleanNumber) {
    return "";
  }

  const brandName = (
    options.businessName || "Nandhini Makeup & Jewellery"
  ).toUpperCase();
  const lines: string[] = [];

  if (options.orderNumber) {
    lines.push(`✨ *ORDER #${options.orderNumber} • ${brandName}* ✨`);
    lines.push("");
    lines.push(
      `Hello! I have placed an order and would like to confirm the details:`
    );
  } else {
    lines.push(`✨ *ORDER ENQUIRY • ${brandName}* ✨`);
    lines.push("");
    lines.push(
      `Hello! I would like to order the following items currently in my cart:`
    );
  }

  lines.push("");
  lines.push(`🛍️ *SELECTED JEWELLERY ITEMS:*`);

  options.items.forEach((item, idx) => {
    const badge =
      idx < NUMBER_BADGES.length ? NUMBER_BADGES[idx] : `${idx + 1}.`;
    lines.push(`${badge} *${item.name}*`);
    lines.push(`   ▫️ Quantity: ${item.quantity}`);
    lines.push(`   ▫️ Price: ${formatINR(item.price)} each`);
    lines.push(`   ▫️ Item Total: ${formatINR(item.lineTotal)}`);
    lines.push("");
  });

  lines.push(`─────────────────────────────`);
  lines.push(`🧾 *BILLING SUMMARY:*`);
  lines.push(`• Subtotal: ${formatINR(options.subtotal)}`);
  lines.push(
    `• Delivery: ${options.isFreeDelivery ? "FREE" : formatINR(options.deliveryCharge)}`
  );
  lines.push(`• *Grand Total: ${formatINR(options.total)}*`);
  lines.push(`─────────────────────────────`);

  const hasCustomerDetails =
    Boolean(options.customerName?.trim()) ||
    Boolean(options.customerPhone?.trim()) ||
    Boolean(options.deliveryCity?.trim());

  if (hasCustomerDetails) {
    lines.push("");
    lines.push(`👤 *CUSTOMER DETAILS:*`);
    if (options.customerName?.trim()) {
      lines.push(`• Name: ${options.customerName.trim()}`);
    }
    if (options.customerPhone?.trim()) {
      lines.push(`• Contact: ${options.customerPhone.trim()}`);
    }
    if (options.deliveryCity?.trim()) {
      const location = [
        options.deliveryCity.trim(),
        options.deliveryState?.trim(),
      ]
        .filter(Boolean)
        .join(", ");
      lines.push(`• Location: ${location}`);
    }
  }

  if (options.orderUrl) {
    lines.push("");
    lines.push(`🔗 *Order Link:* ${options.orderUrl}`);
  }

  lines.push("");
  if (options.orderNumber) {
    lines.push(
      `💬 *Please confirm receipt and share the payment verification / dispatch timeline.* 🙏`
    );
  } else {
    lines.push(
      `💬 *Please confirm product availability and share the UPI QR code to complete my order.* 🙏`
    );
  }

  const messageText = lines.join("\n");
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(messageText)}`;
}
