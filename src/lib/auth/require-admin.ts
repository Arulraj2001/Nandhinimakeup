import { createClient } from "@/lib/supabase/server";

export interface AdminAuthResult {
  userId: string;
  userEmail: string;
  role: "owner" | "editor";
  supabase: Awaited<ReturnType<typeof createClient>>;
}

export type VerifyAdminResponse =
  | {
      ok: true;
      data: AdminAuthResult;
    }
  | {
      ok: false;
      error: string;
    };

export async function verifyAdmin(): Promise<VerifyAdminResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        ok: false,
        error: "Authentication required. Please sign in as an administrator.",
      };
    }

    const { data: adminRecord, error: adminError } = await supabase
      .from("admins")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError || !adminRecord) {
      return {
        ok: false,
        error:
          "Access denied. Your account is not authorized as an administrator.",
      };
    }

    return {
      ok: true,
      data: {
        userId: user.id,
        userEmail: user.email ?? "",
        role: adminRecord.role,
        supabase,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while verifying administrator permissions.",
    };
  }
}
