/**
 * Instagram utility functions for profile links, reels, and handles.
 */

export function cleanInstagramUrl(
  input?: string | null
): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // If it's an @handle like @priya_bridal or just priya_bridal (no spaces or slashes)
  if (trimmed.startsWith("@")) {
    const handle = trimmed.slice(1).trim();
    if (!handle) return null;
    return `https://www.instagram.com/${handle}/`;
  }

  // If handle without @ (alphanumeric + dots + underscores)
  if (/^[a-zA-Z0-9._]{2,30}$/.test(trimmed)) {
    return `https://www.instagram.com/${trimmed}/`;
  }

  // If it starts with instagram.com or www.instagram.com
  if (trimmed.startsWith("instagram.com/") || trimmed.startsWith("www.instagram.com/")) {
    return `https://${trimmed}`;
  }

  // If it starts with http:// or https://
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      if (
        parsed.hostname === "instagram.com" ||
        parsed.hostname === "www.instagram.com" ||
        parsed.hostname.endsWith(".instagram.com")
      ) {
        return parsed.toString();
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function extractInstagramHandle(
  input?: string | null
): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("@")) {
    return trimmed;
  }

  // Plain handle
  if (/^[a-zA-Z0-9._]{2,30}$/.test(trimmed)) {
    return `@${trimmed}`;
  }

  // URL parsing
  try {
    const url = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    const parsed = new URL(url);
    if (parsed.hostname.includes("instagram.com")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length === 1 && !["p", "reel", "reels", "stories", "tv", "explore"].includes(parts[0])) {
        return `@${parts[0]}`;
      }
      if (parts.length >= 2 && ["p", "reel", "reels"].includes(parts[0])) {
        return null; // Post or reel rather than personal profile
      }
    }
  } catch {
    // Ignore invalid URL
  }

  return null;
}

export function detectInstagramType(
  url?: string | null
): "reel" | "post" | "profile" | null {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes("/reel/") || lower.includes("/reels/")) return "reel";
  if (lower.includes("/p/")) return "post";
  if (lower.includes("instagram.com")) return "profile";
  return null;
}

export function extractInstagramShortcode(
  url?: string | null
): string | null {
  if (!url) return null;
  const match = url.match(/instagram\.com\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/i);
  return match ? match[1] : null;
}

export function getInstagramEmbedUrl(
  url?: string | null
): string | null {
  const code = extractInstagramShortcode(url);
  if (!code) return null;
  return `https://www.instagram.com/reel/${code}/embed/`;
}

/**
 * Extracts Instagram info from explicit URL or fallback text (such as occasion or caption)
 */
export function resolveInstagramData(
  explicitUrl?: string | null,
  fallbackText?: string | null
): {
  url: string | null;
  handle: string | null;
  type: "reel" | "post" | "profile" | null;
  shortcode: string | null;
  embedUrl: string | null;
} {
  const directUrl = cleanInstagramUrl(explicitUrl);
  if (directUrl) {
    const shortcode = extractInstagramShortcode(directUrl);
    return {
      url: directUrl,
      handle:
        extractInstagramHandle(explicitUrl) ||
        extractInstagramHandle(directUrl),
      type: detectInstagramType(directUrl),
      shortcode,
      embedUrl: shortcode ? getInstagramEmbedUrl(directUrl) : null,
    };
  }

  // Scan fallbackText for @handle or instagram link
  if (fallbackText) {
    const matchHandle = fallbackText.match(/@([a-zA-Z0-9._]{2,30})/);
    if (matchHandle) {
      const handle = `@${matchHandle[1]}`;
      return {
        url: cleanInstagramUrl(handle),
        handle,
        type: "profile",
        shortcode: null,
        embedUrl: null,
      };
    }

    const matchUrl = fallbackText.match(
      /https?:\/\/(www\.)?instagram\.com\/[^\s)]+/
    );
    if (matchUrl) {
      const url = cleanInstagramUrl(matchUrl[0]);
      const shortcode = extractInstagramShortcode(url);
      return {
        url,
        handle: extractInstagramHandle(url),
        type: detectInstagramType(url),
        shortcode,
        embedUrl: shortcode ? getInstagramEmbedUrl(url) : null,
      };
    }
  }

  return { url: null, handle: null, type: null, shortcode: null, embedUrl: null };
}
