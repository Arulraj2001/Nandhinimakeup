import { z } from "zod";
import { INDIAN_STATES_AND_UTS } from "@/lib/constants/indian-states";

export function normalizeIndianPhone(raw: string): string | null {
  if (!raw) return null;
  let digits = raw.trim().replace(/[\s\-().]/g, "");

  if (digits.startsWith("+91")) {
    digits = digits.slice(3);
  } else if (digits.startsWith("91") && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }

  if (/^[6-9]\d{9}$/.test(digits)) {
    return `+91${digits}`;
  }

  return null;
}

export const checkoutItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z
    .number()
    .int()
    .min(1, "Quantity must be at least 1")
    .max(10, "Quantity cannot exceed 10"),
});

export const checkoutFormSchema = z.object({
  customer_name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),
  phone: z
    .string()
    .trim()
    .refine((val) => normalizeIndianPhone(val) !== null, {
      message:
        "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)",
    }),
  email: z
    .string()
    .trim()
    .max(100, "Email cannot exceed 100 characters")
    .email("Please enter a valid email address")
    .or(z.literal("")),
  address_line_1: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(150, "Address cannot exceed 150 characters"),
  address_line_2: z
    .string()
    .trim()
    .max(150, "Address line 2 cannot exceed 150 characters")
    .optional(),
  city: z
    .string()
    .trim()
    .min(2, "City must be at least 2 characters")
    .max(60, "City cannot exceed 60 characters"),
  state: z.enum(INDIAN_STATES_AND_UTS, {
    message: "Please select a valid Indian State or Union Territory",
  }),
  pin_code: z
    .string()
    .trim()
    .regex(
      /^[1-9][0-9]{5}$/,
      "Please enter a valid 6-digit Indian PIN code not starting with 0"
    ),
  customer_note: z
    .string()
    .trim()
    .max(500, "Note cannot exceed 500 characters")
    .optional(),
  honeypot: z.string().optional(),
});

export const checkoutSubmissionSchema = checkoutFormSchema.extend({
  items: z
    .array(checkoutItemSchema)
    .min(1, "Cart must contain at least 1 item")
    .max(20, "Cart cannot exceed 20 items"),
});

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;
export type CheckoutSubmissionData = z.infer<typeof checkoutSubmissionSchema>;
