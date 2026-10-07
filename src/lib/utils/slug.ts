/**
 * Converts input text into a clean, lowercase, hyphen-separated URL-safe slug.
 * Strips unsupported characters without external packages.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars (except spaces and dashes)
    .replace(/[\s_-]+/g, "-") // Replace spaces, underscores and consecutive dashes with a single -
    .replace(/^-+|-+$/g, ""); // Remove leading and trailing dashes
}
