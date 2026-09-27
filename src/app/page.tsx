import { HomeAboutSection } from "@/components/home/home-about-section";
import { HomeArticlesSection } from "@/components/home/home-articles-section";
import { HomeHero } from "@/components/home/home-hero";
import { HomeHistorySection } from "@/components/home/home-history-section";
import { HomeServicesSection } from "@/components/home/home-services-section";
import { HomeWorksSection } from "@/components/home/home-works-section";
import { getPageSection } from "@/lib/admin-content";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({ title: "Ανάπτυξη σχολών και ακαδημιών ποδοσφαίρου", description: "Ο ΟΑΣΠΕ στηρίζει την οργάνωση, εξέλιξη και προβολή σχολών και ακαδημιών ποδοσφαίρου, με το παιδί στο κέντρο.", path: "/", image: "/images/wordpress/2024/12/oaspe_header_main_page_14.png" });

export default async function Home() {
  const [hero, about, services, projects] = await Promise.all([getPageSection("home", "hero"), getPageSection("home", "about"), getPageSection("home", "services"), getPageSection("home", "projects")]);
  return <main>
    <HomeHero title={hero?.title ?? "Ανάπτυξη ακαδημιών. Με το παιδί στο επίκεντρο."} body={hero?.body ?? "Στηρίζουμε την οργάνωση, την εξέλιξη και την προβολή σχολών και ακαδημιών ποδοσφαίρου σε όλη την Ελλάδα και τον ελληνισμό της διασποράς."} image={hero?.imagePath ?? "/images/wordpress/2024/12/oaspe_header_main_page_14.png"}/>
    <HomeAboutSection title={about?.title ?? "Πρωτοπορούμε στα αθλητικά δρώμενα της χώρας."} body={about?.body ?? "Ο ΟΑΣΠΕ δημιουργήθηκε με έμπνευση της Δώρας Ιωακειμίδου. Εδώ και περισσότερα από δέκα χρόνια, επαγγελματίες της αθλητικής διοίκησης και του marketing συνεργάζονται με προπονητές και επιστήμονες."} image={about?.imagePath ?? "/images/wordpress/2024/10/football-about.jpg"}/>
    <HomeServicesSection title={services?.title}/><HomeWorksSection title={projects?.title}/><HomeArticlesSection/><HomeHistorySection/>
  </main>;
}
import type { Metadata } from "next";
