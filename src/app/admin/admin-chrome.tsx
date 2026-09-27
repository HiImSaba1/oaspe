"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FolderKanban, Gauge, Images, Mail, Menu, NotebookText, X } from "lucide-react";
import { logoutAction } from "./actions";

const links = [
  ["/admin/overview", "Επισκόπηση", Gauge], ["/admin/pages", "Σελίδες", NotebookText], ["/admin/projects", "Έργα", FolderKanban], ["/admin/media", "Εικόνες", Images], ["/admin/messages", "Μηνύματα", Mail], ["/admin/guide", "Οδηγός", NotebookText],
] as const;

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const [open, setOpen] = useState(false);
  return <div className="admin-shell"><aside className={open ? "is-open" : ""}><div className="admin-brand"><b>ΟΑΣΠΕ</b><span>Content studio</span></div><nav>{links.map(([href, label, Icon]) => <Link key={href} href={href} onClick={() => setOpen(false)} className={pathname.startsWith(href) ? "active" : ""}><Icon size={18}/><span>{label}</span></Link>)}</nav><form action={logoutAction}><button>Αποσύνδεση</button></form></aside><div className="admin-stage"><header><span>OASPE ADMIN</span><button type="button" aria-label="Μενού διαχείρισης" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button></header>{children}</div></div>;
}
