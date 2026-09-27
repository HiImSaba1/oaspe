import type { Metadata } from "next";
import "./admin.css";
import "./admin-shell-visibility.css";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { AdminChrome } from "./admin-chrome";
export const metadata: Metadata = { title: "Διαχείριση", robots: { index: false, follow: false, nocache: true } };
export default async function AdminLayout({ children }: { children: React.ReactNode }) { return (await isAdminAuthenticated()) ? <AdminChrome>{children}</AdminChrome> : children; }
