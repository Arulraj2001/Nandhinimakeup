import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "./admin-shell";

export const instant = false;

export default async function AdminProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Check if user exists in the admins table
  const { data: adminRecord } = await supabase
    .from("admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRecord) {
    // User is signed into auth but has no record in the admins table
    await supabase.auth.signOut();
    redirect("/admin/login?error=unauthorized");
  }

  return <AdminShell userEmail={user.email ?? ""}>{children}</AdminShell>;
}
