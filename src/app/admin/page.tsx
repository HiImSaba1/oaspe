import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { LoginForm } from "./login-form";
export default async function AdminPage() { if (await isAdminAuthenticated()) redirect("/admin/overview"); return <main className="admin-login"><div className="admin-login-image"/><LoginForm /></main>; }
