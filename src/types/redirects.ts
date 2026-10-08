import { z } from "zod";
import type { Database } from "@/types/database";

export type RedirectRow = Database["public"]["Tables"]["redirects"]["Row"];

export const saveRedirectSchema = z
  .object({
    id: z.string().uuid().optional(),
    from_path: z
      .string()
      .trim()
      .min(1, "Source path is required")
      .refine(
        (val) => val.startsWith("/"),
        "Source path must start with a slash (/)"
      )
      .refine(
        (val) => !val.startsWith("/admin"),
        "Source path cannot be under the /admin path"
      ),
    to_path: z
      .string()
      .trim()
      .min(1, "Target destination is required")
      .refine(
        (val) =>
          (val.startsWith("/") && !val.startsWith("//")) ||
          val.startsWith("https://"),
        "Target must be a relative path (starting with /) or an https:// URL"
      ),
    status_code: z.union([z.literal(301), z.literal(302)]),
  })
  .refine(
    (data) => data.from_path !== data.to_path,
    {
      message: "Source and target paths cannot be identical (self-redirect)",
      path: ["to_path"],
    }
  );

export type SaveRedirectInput = z.infer<typeof saveRedirectSchema>;
