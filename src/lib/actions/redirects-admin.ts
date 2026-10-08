"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { verifyAdmin } from "@/lib/auth/require-admin";
import {
  type ActionResult,
  actionSuccess,
  actionError,
} from "@/lib/actions/action-result";
import { revalidateCacheTag } from "@/lib/utils/revalidate";
import {
  saveRedirectSchema,
  type SaveRedirectInput,
  type RedirectRow,
} from "@/types/redirects";
import type { Database } from "@/types/database";
import { normalizeRedirectPath } from "@/lib/data/redirects";

/**
 * Returns all redirects for admin management.
 */
export async function getAdminRedirects(): Promise<ActionResult<RedirectRow[]>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { data, error } = await auth.data.supabase
    .from("redirects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return actionError(error.message || "Failed to load redirects");
  }

  return actionSuccess(data || []);
}

/**
 * Validates and saves an admin redirect.
 * Enforces:
 * - from_path starts with '/' and is not under '/admin'
 * - no duplicate from_paths
 * - no self-redirect
 * - no chains (target cannot be an existing redirect source)
 * - no loops (cycle detection)
 * - repoints any older redirects targeting from_path to to_path
 */
export async function saveAdminRedirect(
  input: SaveRedirectInput
): Promise<ActionResult<RedirectRow>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const parsed = saveRedirectSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message || "Invalid redirect data");
  }

  const fromPath = normalizeRedirectPath(parsed.data.from_path);
  let toPath = parsed.data.to_path.trim();
  if (toPath.startsWith("/")) {
    toPath = normalizeRedirectPath(toPath);
  }

  // 1. Self redirect check
  if (fromPath === toPath) {
    return actionError("Source and target paths cannot be identical (self-redirect)");
  }

  // 2. Admin path check
  if (fromPath.startsWith("/admin")) {
    return actionError("Cannot redirect from an /admin path");
  }

  const supabase = auth.data.supabase;

  // 3. Duplicate from_path check
  const { data: existingFrom } = await supabase
    .from("redirects")
    .select("id")
    .eq("from_path", fromPath)
    .maybeSingle();

  if (existingFrom && existingFrom.id !== parsed.data.id) {
    return actionError(`A redirect already exists for source path "${fromPath}".`);
  }

  // 4. Chain prevention: target path cannot be an existing redirect source
  if (toPath.startsWith("/")) {
    const { data: existingTargetRedirect } = await supabase
      .from("redirects")
      .select("from_path, to_path")
      .eq("from_path", toPath)
      .maybeSingle();

    if (existingTargetRedirect && existingTargetRedirect.from_path !== fromPath) {
      return actionError(
        `Cannot create chained redirect: target "${toPath}" is already redirected to "${existingTargetRedirect.to_path}". Please redirect directly to the final destination.`
      );
    }
  }

  // 5. Loop prevention: check redirect graph for cycles
  if (toPath.startsWith("/")) {
    const { data: allRedirects } = await supabase
      .from("redirects")
      .select("id, from_path, to_path");

    const redirectMap = new Map<string, string>();
    for (const r of allRedirects || []) {
      if (parsed.data.id && r.id === parsed.data.id) continue;
      redirectMap.set(r.from_path, r.to_path);
    }
    // Add current proposed edge
    redirectMap.set(fromPath, toPath);

    // Follow path from toPath
    let current = toPath;
    const visited = new Set<string>([fromPath]);
    while (current && redirectMap.has(current)) {
      if (visited.has(current)) {
        return actionError("Cannot save redirect: this configuration would create an infinite redirect loop.");
      }
      visited.add(current);
      current = redirectMap.get(current)!;
    }
  }

  // 6. Chain prevention: repoint older redirects targeting fromPath to toPath
  await supabase
    .from("redirects")
    .update({ to_path: toPath })
    .eq("to_path", fromPath);

  // 7. Upsert redirect
  const payload = {
    ...(parsed.data.id ? { id: parsed.data.id } : {}),
    from_path: fromPath,
    to_path: toPath,
    status_code: parsed.data.status_code,
  };

  const { data, error } = await supabase
    .from("redirects")
    .upsert(payload, { onConflict: "from_path" })
    .select()
    .single();

  if (error) {
    return actionError(error.message || "Failed to save redirect");
  }

  revalidateCacheTag("redirects");

  return actionSuccess(data as RedirectRow);
}

/**
 * Deletes a redirect with admin authorization.
 */
export async function deleteAdminRedirect(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const auth = await verifyAdmin();
  if (!auth.ok) {
    return actionError(auth.error);
  }

  const { error } = await auth.data.supabase
    .from("redirects")
    .delete()
    .eq("id", id);

  if (error) {
    return actionError(error.message || "Failed to delete redirect");
  }

  revalidateCacheTag("redirects");

  return actionSuccess({ id });
}

/**
 * Automatic redirect helper called during entity slug changes.
 * - Removes any existing redirect where from_path = newUrl (live URL cannot be a redirect source)
 * - Repoints any existing redirects where to_path = oldUrl to newUrl (chain prevention)
 * - Upserts a permanent (301) redirect from oldUrl to newUrl
 */
export async function createAutomaticSlugRedirect(
  supabase: SupabaseClient<Database>,
  oldUrl: string,
  newUrl: string
): Promise<void> {
  const fromPath = normalizeRedirectPath(oldUrl);
  const toPath = normalizeRedirectPath(newUrl);

  if (fromPath === toPath) return;

  // 1. If an existing redirect source equals the new live URL, remove it
  await supabase.from("redirects").delete().eq("from_path", toPath);

  // 2. Prevent chains: if existing redirects target oldUrl, repoint them to newUrl
  await supabase
    .from("redirects")
    .update({ to_path: toPath })
    .eq("to_path", fromPath);

  // 3. Upsert permanent redirect from oldUrl to newUrl
  await supabase.from("redirects").upsert(
    {
      from_path: fromPath,
      to_path: toPath,
      status_code: 301,
    },
    { onConflict: "from_path" }
  );

  // 4. Invalidate redirects cache tag
  revalidateCacheTag("redirects");
}
