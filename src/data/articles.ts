import source from "./generated/wxr-greek-content.json";

export type Article = {
  wordpressId: number;
  slug: string;
  title: string;
  date: string;
  publishedAt: string;
  author: string;
  category: string;
  categories: readonly string[];
  tags: readonly string[];
  image: string;
  summary: string;
  contentHtml: string;
  wordCount: number;
  readingMinutes: number;
};

const reviewedImages: Record<string, string> = {
  "13o-therino-toyrnoya-golden-cup-generation-next": "/images/wordpress/2019/05/13o_GOLDEN_CUP_SUMMER_19-new_.jpg",
  "12o-golden-cup-aylaia-me-chamogela": "/images/wordpress/2019/05/12ogoldencup_aponomes-1.jpg",
  "12o-golden-cup-ta-zeygaria-ton-telikon": "/images/wordpress/2019/05/12ogoldencup_ladies.jpg",
  "2o-sportx-camp-2019-i-eyropi-sta-podia-toys": "/images/wordpress/2019/03/sportxcamp2019_.jpg",
  "12o-paschalino-toyrnoya-golden-cup-generation-next": "/images/wordpress/2019/01/12o_PASXA_AFISA_2019_NEW.jpg",
  "athens-half-marathon-expo-sports-show-2019": "/images/wordpress/2019/02/fb_1080x1080_halfmarathon-sportshow2019.jpg",
};

const fallbackImages = [
  "/images/wordpress/2016/03/Acadimies_big-1.jpg",
  "/images/wordpress/2016/02/goneis_paidia_17.jpg",
  "/images/wordpress/2016/05/soccer_kids.jpg",
  "/images/wordpress/2024/10/football-about.jpg",
] as const;

function displayDate(value: string | null) {
  if (!value) return "";
  const [date] = value.split(" ");
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}`;
}

function primaryCategory(categories: readonly string[]) {
  return categories.find((category) => category !== "Άρθρα") ?? categories[0] ?? "Αρχείο ΟΑΣΠΕ";
}

export const articles: readonly Article[] = source.articles.map((article, index) => ({
  wordpressId: article.wordpressId,
  slug: article.slug,
  title: article.title,
  date: displayDate(article.publishedAt),
  publishedAt: article.publishedAt ? `${article.publishedAt.replace(" ", "T")}+03:00` : "",
  author: article.author === "Dora Ioakeimidou" ? "Δώρα Ιωακειμίδου" : article.author || "ΟΑΣΠΕ",
  category: primaryCategory(article.categories),
  categories: article.categories,
  tags: article.tags,
  image: reviewedImages[article.slug] ?? article.heroImage ?? fallbackImages[index % fallbackImages.length],
  summary: article.description,
  contentHtml: article.contentHtml,
  wordCount: article.wordCount,
  readingMinutes: Math.max(1, Math.ceil(article.wordCount / 220)),
}));

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}

export const articleCategories = [...new Set(articles.flatMap((article) => article.categories).filter((category) => category !== "Άρθρα"))];

export function getRelatedArticles(slug: string, category: string, limit = 3) {
  return [...articles]
    .filter((article) => article.slug !== slug)
    .sort((left, right) => Number(right.category === category) - Number(left.category === category))
    .slice(0, limit);
}
