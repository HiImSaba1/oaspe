import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/page-hero";
import { EditorialPageContent, type EditorialPageData } from "@/components/pages/editorial-page-content";
import { LegalPageContent } from "@/components/pages/legal-page-content";
import { legalPages } from "@/data/legal-pages";
import { getPageSection } from "@/lib/admin-content";
import { publicMetadata } from "@/lib/seo";

const pages = {
  sxetika: { title: "Σχετικά με εμάς", eyebrow: "Ο ΟΑΣΠΕ", copy: "Ένας οργανισμός με το παιδί, την οικογένεια και την αξία της συμμετοχής στο κέντρο.", image: "/images/wordpress/2024/10/oaspe_QUOTE_BANNER_2-scaled.jpg" },
  skopos: { title: "Ο σκοπός του ΟΑΣΠΕ", eyebrow: "Η αποστολή μας", copy: "Εργαζόμαστε για έναν αθλητισμό που εκπαιδεύει, ενώνει και προστατεύει κάθε παιδί.", image: "/images/wordpress/2016/02/skopos_17.jpg" },
  arthra: { title: "Τα άρθρα μας", eyebrow: "Γνώση & ενημέρωση", copy: "Άρθρα, απόψεις και χρήσιμες πληροφορίες για γονείς, παιδιά και ανθρώπους του αθλητισμού.", image: "/images/wordpress/2024/10/we_like_you_too_oaspe.jpg" },
  dwrees: { title: "Δωρεές", eyebrow: "Στηρίξτε το έργο", copy: "Κάθε προσφορά βοηθά να δημιουργήσουμε περισσότερες δράσεις με ουσιαστικό κοινωνικό αποτύπωμα.", image: "/images/wordpress/2016/02/oaspe_kid.jpg" },
  "oroi-chrisis": { title: "Όροι χρήσης & προσωπικά δεδομένα", eyebrow: "Νομικές πληροφορίες", copy: "Οι όροι λειτουργίας, η πολιτική απορρήτου και η προστασία των προσωπικών δεδομένων των επισκεπτών μας.", image: "/images/wordpress/2016/05/OASPE_background.jpg" },
  "cookie-policy": { title: "Πολιτική cookies", eyebrow: "Νομικές πληροφορίες", copy: "Πληροφορίες για τη χρήση cookies και τις επιλογές απορρήτου των επισκεπτών μας.", image: "/images/wordpress/2016/05/OASPE_background.jpg" },
} as const;
type PageSlug = keyof typeof pages;

const editorialPages: Partial<Record<PageSlug, EditorialPageData>> = {
  sxetika: {
    label: "Ο οργανισμός",
    statement: "Ένας πρωτοποριακός οργανισμός για τα ελληνικά αθλητικά δρώμενα.",
    body: [
      "Βασικός στόχος του ΟΑΣΠΕ είναι η ανάπτυξη και η βελτίωση, σε όλα τα επίπεδα, των ποδοσφαιρικών ακαδημιών στην ελληνική επικράτεια και στην ομογένεια, με οδηγό τις ανάγκες κάθε συλλόγου.",
      "Τον Οργανισμό Ανάπτυξης Σχολών Ποδοσφαίρου Ελλάδας εμπνεύστηκε η Δώρα Ιωακειμίδου, με μακρά διαδρομή και εμπειρία στο πεδίο των ακαδημιών — την ελπίδα όχι μόνο του ποδοσφαίρου, αλλά και της κοινωνίας μας.",
    ],
    images: [
      { src: "/images/wordpress/2024/10/oaspe_QUOTE_BANNER_2-scaled.jpg", alt: "Οι αξίες του ΟΑΣΠΕ" },
      { src: "/images/wordpress/2024/10/oaspe_LAMP_BANNER_11zon-scaled.jpg", alt: "Ιδέες και ανάπτυξη ακαδημιών" },
      { src: "/images/wordpress/2024/10/we_like_you_too_oaspe.jpg", alt: "Η κοινότητα του ΟΑΣΠΕ" },
    ],
    listTitle: "Το παιδί, ο σύλλογος και η κοινότητα στο ίδιο γήπεδο.",
    items: [
      "Ανάπτυξη των ποδοσφαιρικών ακαδημιών με βάση τις ιδιαίτερες ανάγκες κάθε συλλόγου.",
      "Συνεργασία επαγγελματιών της διοίκησης, της προπόνησης και των αθλητικών επιστημών.",
      "Σύνδεση της αθλητικής εξέλιξης με την εκπαίδευση, την κοινωνία και τις αξίες του παιχνιδιού.",
    ],
    cta: { label: "Επικοινωνήστε μαζί μας", href: "/epikoinonia" },
  },
  skopos: {
    label: "Ο σκοπός μας",
    statement: "Έρευνα, συνεργασία και εκπαίδευση για την εξέλιξη του αναπτυξιακού ποδοσφαίρου.",
    body: [
      "Ο ΟΑΣΠΕ μελετά ζητήματα οργάνωσης, ανάπτυξης, προβολής και διοίκησης των σχολών και αθλητικών ακαδημιών ποδοσφαίρου.",
      "Συμβάλλει εποικοδομητικά στην ανάπτυξη του αθλητισμού και καταθέτει προτάσεις προς τις αρμόδιες αρχές για περαιτέρω πρόοδο.",
    ],
    images: [
      { src: "/images/wordpress/2019/05/12ogoldencup_aponomes-1.jpg", alt: "Απονομές σε διοργάνωση Golden Cup" },
      { src: "/images/wordpress/2018/09/oaspe_vravefsi_epsm.jpg", alt: "Βράβευση του ΟΑΣΠΕ" },
    ],
    listTitle: "Οι στόχοι γίνονται πράξη μέσα από κοινές πρωτοβουλίες.",
    items: [
      "Δημιουργική επικοινωνία σχολών ποδοσφαίρου και μελών του οργανισμού στην Ελλάδα και στο εξωτερικό.",
      "Συνεργασία με επιστημονικούς κλάδους όπως το δίκαιο, η οικονομία, η κοινωνιολογία και η ψυχολογία.",
      "Οργάνωση εκπαιδευτικών προγραμμάτων, εκδηλώσεων, σεμιναρίων και τουρνουά για τμήματα υποδομής.",
      "Κοινές επιστημονικές και αθλητικές δράσεις με ελληνικούς και διεθνείς φορείς.",
    ],
    cta: { label: "Δείτε τα έργα μας", href: "/erga" },
  },
  dwrees: {
    label: "Στήριξη",
    statement: "Η υποστήριξη γίνεται δράση για τους συλλόγους και τα παιδιά.",
    body: [
      "Ο ΟΑΣΠΕ ευχαριστεί θερμά τα μέλη, τους υποστηρικτές και τους χορηγούς που βοηθούν την προσπάθειά μας να προσφέρουμε υπηρεσίες υψηλού επιπέδου σε αθλητικούς συλλόγους.",
      "Για την πραγματοποίηση των δράσεών μας δεχόμαστε οικονομική υποστήριξη από μέλη και κοινωνικά υπεύθυνες επιχειρήσεις.",
    ],
    images: [
      { src: "/images/wordpress/2024/10/dwrees_oaspe_header-scaled.jpg", alt: "Υποστήριξη των δράσεων του ΟΑΣΠΕ" },
      { src: "/images/wordpress/2024/10/donation_oaspe_banner.png", alt: "Δωρεές προς τον ΟΑΣΠΕ" },
    ],
    listTitle: "Διαφάνεια και τεκμηρίωση σε κάθε προσφορά.",
    items: [
      "Οι δωρεές καταγράφονται στα επίσημα βιβλία του οργανισμού και συνοδεύονται από το προβλεπόμενο παραστατικό.",
      "Για χρηματικές δωρεές απαιτείται αποδεικτικό κατάθεσης μέσω τραπεζικού ιδρύματος.",
      "Οι επιχειρήσεις μπορούν να συνδέσουν την κοινωνική τους προσφορά με δράσεις του αναπτυξιακού ποδοσφαίρου.",
    ],
    cta: { label: "Μιλήστε με τον ΟΑΣΠΕ", href: "/epikoinonia" },
  },
};
export function generateStaticParams() { return Object.keys(pages).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const page = pages[slug as PageSlug]; return page ? publicMetadata({ title: page.title, description: page.copy, path: `/${slug}`, image: page.image }) : {}; }
export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const page = pages[slug as PageSlug]; if (!page) notFound();
  const managedHero = await getPageSection(slug, "hero");
  const editorial = editorialPages[slug as PageSlug];
  const legal = slug === "oroi-chrisis" || slug === "cookie-policy" ? legalPages[slug] : null;
  return <main><PageHero title={managedHero?.title ?? page.title} eyebrow={page.eyebrow} intro={managedHero?.body ?? page.copy} image={managedHero?.imagePath ?? page.image} priority />{editorial ? <EditorialPageContent data={editorial} /> : null}{legal ? <LegalPageContent data={legal} /> : null}</main>;
}
