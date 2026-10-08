import { redirect, permanentRedirect, notFound } from "next/navigation";
import { getRedirectForPath } from "@/lib/data/redirects";

/**
 * Checks the cached redirects table for a route that was not found.
 * If a matching redirect is found, performs 301 (permanentRedirect) or 302 (redirect).
 * Otherwise invokes notFound().
 */
export async function handleRedirectOrNotFound(path: string): Promise<never> {
  const match = await getRedirectForPath(path);
  if (match) {
    if (match.status_code === 301) {
      permanentRedirect(match.to_path);
    } else {
      redirect(match.to_path);
    }
  }
  notFound();
}
