import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import { Providers } from "@/components/Providers";
import { StructuredData } from "@/components/StructuredData";
import { LOCALES, type Locale } from "@/lib/i18n";
import { LOCALE_TAGS, META, SITE, localePath } from "@/lib/seo";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const notoDev = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-dev",
  display: "swap",
});

/**
 * An optional catch-all rather than a required [locale] segment, so English keeps
 * the bare origin as its canonical URL — `/` outranks `/en` for a site whose
 * primary audience arrives from a plain search — while Nepali and Hindi get real,
 * separately indexable URLs at /ne and /hi.
 */
type Params = { locale?: string[] };

export function generateStaticParams(): Params[] {
  return [{ locale: [] }, { locale: ["ne"] }, { locale: ["hi"] }];
}

function resolveLocale(segments: string[] | undefined): Locale {
  if (!segments || segments.length === 0) return "en";
  if (segments.length > 1) notFound();
  const candidate = segments[0];
  if (!(LOCALES as readonly string[]).includes(candidate)) notFound();
  // /en would duplicate the root; keep exactly one URL per language.
  if (candidate === "en") notFound();
  return candidate as Locale;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const meta = META[locale];

  // Every language points at every other, including itself, plus x-default.
  // Without this Google treats the three pages as competing duplicates.
  const languages: Record<string, string> = { "x-default": localePath("en") };
  for (const l of LOCALES) languages[LOCALE_TAGS[l]] = localePath(l);

  return {
    metadataBase: new URL(SITE.url),
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    applicationName: SITE.name,
    authors: [{ name: SITE.author, url: SITE.authorUrl }],
    creator: SITE.author,
    publisher: SITE.author,
    alternates: { canonical: localePath(locale), languages },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title: meta.title,
      description: meta.description,
      url: localePath(locale),
      locale: LOCALE_TAGS[locale].replace("-", "_"),
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: meta.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: ["/opengraph-image"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
    category: "news",
    other: {
      // Read by some crisis aggregators and regional search surfaces.
      "geo.region": "NP",
      "geo.placename": "Nepal",
      coverage: "Nepal",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1014" },
  ],
};

/** Applies the stored theme before first paint so there is no light-mode flash. */
const themeScript = `(function(){try{var t=localStorage.getItem('nfw.theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
}) {
  const locale = resolveLocale((await params).locale);

  return (
    <html
      lang={LOCALE_TAGS[locale]}
      data-locale={locale}
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <link rel="preconnect" href="https://flood-api.open-meteo.com" />
        <link rel="preconnect" href="https://api.open-meteo.com" />
        <StructuredData locale={locale} />
      </head>
      <body className={`${inter.variable} ${notoDev.variable}`} suppressHydrationWarning>
        <Providers initialLocale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
