import type { Metadata } from "next";
import { ContactLayout } from "@/components/contact/contact-layout";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({ title: "Επικοινωνία", description: "Επικοινωνήστε με τον ΟΑΣΠΕ για δράσεις, συνεργασίες και πρωτοβουλίες.", path: "/epikoinonia", image: "/images/wordpress/2016/02/goneis_paidia_17.jpg" });
export default function ContactPage() { return <ContactLayout />; }
