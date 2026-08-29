import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/i18n";
import { LOCALE_TAGS, SITE, localeUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Each entry declares its siblings, so a crawler that finds any one language
  // immediately learns the other two exist.
  const languages = Object.fromEntries(
    LOCALES.map((l) => [LOCALE_TAGS[l], localeUrl(l)])
  );

  return LOCALES.map((locale) => ({
    url: localeUrl(locale),
    lastModified: now,
    // A live disaster page genuinely changes hourly; saying so is honest and keeps
    // the crawl frequent while the event is active.
    changeFrequency: "hourly" as const,
    priority: locale === "en" ? 1 : 0.9,
    alternates: { languages },
  }));
}

export const dynamic = "force-static";

/** Exported for the robots route so both agree on the sitemap location. */
export const SITEMAP_URL = `${SITE.url}/sitemap.xml`;
