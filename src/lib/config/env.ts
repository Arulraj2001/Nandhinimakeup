import { z } from "zod";

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required and must not be empty"),
  ALLOW_INDEXING: z
    .enum(["true", "false"])
    .default("false")
    .transform((val) => val === "true"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required and must not be empty"),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url("NEXT_PUBLIC_SITE_URL must be a valid URL"),
});

const isServer = typeof window === "undefined";

function validateEnv() {
  const clientParsed = clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });

  if (!clientParsed.success) {
    const issues = clientParsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `❌ Invalid or missing client environment variables:\n${issues}`
    );
  }

  if (!isServer) {
    return {
      NEXT_PUBLIC_SUPABASE_URL: clientParsed.data.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        clientParsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SITE_URL: clientParsed.data.NEXT_PUBLIC_SITE_URL,
      ALLOW_INDEXING: false,
      get SUPABASE_SERVICE_ROLE_KEY(): string {
        throw new Error(
          "SUPABASE_SERVICE_ROLE_KEY is server-only and cannot be accessed on the client."
        );
      },
    };
  }

  const serverParsed = serverSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ALLOW_INDEXING: process.env.ALLOW_INDEXING,
  });

  if (!serverParsed.success) {
    const issues = serverParsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `❌ Invalid or missing server environment variables:\n${issues}`
    );
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: clientParsed.data.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      clientParsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: clientParsed.data.NEXT_PUBLIC_SITE_URL,
    ALLOW_INDEXING: serverParsed.data.ALLOW_INDEXING,
    get SUPABASE_SERVICE_ROLE_KEY(): string {
      return serverParsed.data.SUPABASE_SERVICE_ROLE_KEY;
    },
  };
}

export const env = validateEnv();
