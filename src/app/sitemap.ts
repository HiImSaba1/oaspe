import type { MetadataRoute } from "next";
import { articles } from "@/data/articles";
import { listAdminProjects } from "@/lib/admin-projects";
import { getSiteUrl } from "@/lib/seo";

const publicRoutes = ["", "sxetika", "skopos", "erga", "arthra", "dwrees", "epikoinonia", "oroi-chrisis", "cookie-policy"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteUrl();
  const projects = await listAdminProjects();
  const routes = [
    ...publicRoutes,
    ...projects.map(({ slug }) => `erga/${slug}`),
    ...articles.map(({ slug }) => `arthra/${slug}`),
  ];
  return routes.map((route) => ({
    url: new URL(`/${route}`, origin).toString(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "arthra" || route === "erga" ? 0.8 : 0.7,
  }));
}
