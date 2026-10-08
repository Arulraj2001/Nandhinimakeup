import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const envContent = fs.readFileSync(".env.local", "utf8");
export const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/)?.[1]?.trim();
export const SUPABASE_ANON_KEY = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=([^\r\n]+)/)?.[1]?.trim();
export const SUPABASE_SERVICE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/)?.[1]?.trim();
export const PROJECT_REF = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || "unknown";

export const BASE_URL = "http://localhost:3009";

export const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
export const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function saveResult(filename, data) {
  const dir = path.join("tests", "functional", "results");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  return filePath;
}

export function createSessionCookieHeader(session) {
  const cookieName = `sb-${PROJECT_REF}-auth-token`;
  const cookieValue = `base64-${Buffer.from(JSON.stringify(session)).toString("base64")}`;
  return `${cookieName}=${cookieValue}`;
}

