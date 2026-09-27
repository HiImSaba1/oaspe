"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ADMIN_COOKIE_NAME, ADMIN_SESSION_SECONDS, createAdminSessionToken, credentialsMatch, requireAdmin } from "@/lib/admin-auth";
import { savePageSection } from "@/lib/admin-content";

export async function loginAction(_state: { error?: string } | null, formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!credentialsMatch(username, password)) return { error: "Λάθος στοιχεία σύνδεσης." };
  (await cookies()).set(ADMIN_COOKIE_NAME, createAdminSessionToken(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: ADMIN_SESSION_SECONDS, path: "/" });
  redirect("/admin/overview");
}

export async function logoutAction() {
  (await cookies()).delete(ADMIN_COOKIE_NAME);
  redirect("/admin");
}

const sectionSchema = z.object({ pageKey: z.string().min(1).max(80), sectionKey: z.string().min(1).max(80), title: z.string().max(500), body: z.string().max(20000), imagePath: z.string().startsWith("/images/wordpress/").max(500), position: z.coerce.number().int().min(0).max(999) });
export async function savePageSectionAction(formData: FormData) {
  await requireAdmin();
  await savePageSection(sectionSchema.parse(Object.fromEntries(formData)));
  revalidatePath("/admin/pages");
  revalidatePath("/");
  revalidatePath(`/${String(formData.get("pageKey") ?? "")}`);
}
