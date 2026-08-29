import { FAQS, LOCALE_TAGS, META, SITE, localeUrl } from "@/lib/seo";
import { HELPLINES } from "@/lib/helplines";
import { STATIONS } from "@/data/stations";
import type { Locale } from "@/lib/i18n";

/**
 * Schema.org graph, server-rendered.
 *
 * This is the legitimate machine-readable layer — the thing hidden keyword text
 * pretends to be. It is what produces FAQ rich results, what crisis panels read,
 * and what AI answer engines lean on when deciding whether a page is authoritative
 * enough to quote.
 *
 * SpecialAnnouncement is the type Google added specifically for emergency and
 * public-health notices, and it is the single highest-value entry here.
 */
export function StructuredData({ locale }: { locale: Locale }) {
  const url = localeUrl(locale);
  const meta = META[locale];
  const lang = LOCALE_TAGS[locale];

  const publisher = {
    "@type": "Organization",
    "@id": `${SITE.url}/#publisher`,
    name: SITE.author,
    url: SITE.authorUrl,
    sameAs: [SITE.github, SITE.youtube],
  };

  const graph: Record<string, unknown>[] = [
    publisher,

    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      description: meta.description,
      inLanguage: ["en", "ne-NP", "hi-IN"],
      publisher: { "@id": `${SITE.url}/#publisher` },
      isAccessibleForFree: true,
    },

    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: meta.title,
      description: meta.description,
      inLanguage: lang,
      isPartOf: { "@id": `${SITE.url}/#website` },
      isAccessibleForFree: true,
      about: { "@id": `${SITE.url}/#event` },
      /** Signals to answer engines which region this page serves. */
      contentLocation: {
        "@type": "Place",
        name: "Nepal",
        address: { "@type": "PostalAddress", addressCountry: "NP" },
      },
    },

    /**
     * The disaster itself, as an entity. Giving the event a stable @id lets every
     * other node on the page attach to the same real-world thing.
     */
    {
      "@type": "Event",
      "@id": `${SITE.url}/#event`,
      name: "2026 Bhotekoshi–Trishuli flood, Nepal",
      description:
        "A glacier and rock collapse above the Bhotekoshi river near Langtang Lirung on 26 August 2026 triggered a debris avalanche and flash flood down the Bhotekoshi–Trishuli corridor through Rasuwa and Nuwakot districts.",
      startDate: "2026-08-26",
      eventStatus: "https://schema.org/EventScheduled",
      location: {
        "@type": "Place",
        name: "Bhotekoshi–Trishuli corridor, Rasuwa and Nuwakot, Nepal",
        address: { "@type": "PostalAddress", addressCountry: "NP" },
        geo: { "@type": "GeoCoordinates", latitude: 28.16, longitude: 85.33 },
      },
    },

    /** Google's crisis-notice type. */
    {
      "@type": "SpecialAnnouncement",
      "@id": `${url}#announcement`,
      name: meta.title,
      text: meta.description,
      datePosted: "2026-08-26",
      expires: "2026-12-31",
      category: "https://www.wikidata.org/wiki/Q8068",
      inLanguage: lang,
      url,
      announcementLocation: {
        "@type": "Place",
        name: "Nepal",
        address: { "@type": "PostalAddress", addressCountry: "NP" },
      },
      publisher: { "@id": `${SITE.url}/#publisher` },
    },

    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: lang,
      mainEntity: FAQS[locale].map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },

    /** Makes the emergency numbers themselves machine-readable. */
    {
      "@type": "ItemList",
      "@id": `${url}#helplines`,
      name: "Nepal emergency helplines",
      itemListElement: HELPLINES.map((h, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "GovernmentService",
          name: h.label,
          description: h.note,
          serviceArea: { "@type": "Country", name: "Nepal" },
          availableChannel: {
            "@type": "ServiceChannel",
            servicePhone: { "@type": "ContactPoint", telephone: h.number, contactType: "emergency" },
          },
        },
      })),
    },

    /** Declares the underlying open data, which matters for dataset search. */
    {
      "@type": "Dataset",
      "@id": `${url}#dataset`,
      name: "Nepal river discharge and rainfall monitoring points",
      description:
        "Modelled river discharge (Copernicus GloFAS) and rainfall forecasts (ECMWF, GFS) for 12 monitoring points across Nepal's major river basins, including the Bhotekoshi–Trishuli corridor affected by the 26 August 2026 flood.",
      license: "https://creativecommons.org/licenses/by/4.0/",
      isAccessibleForFree: true,
      creator: { "@id": `${SITE.url}/#publisher` },
      spatialCoverage: {
        "@type": "Place",
        geo: {
          "@type": "GeoShape",
          box: "26.8 80.9 28.7 87.2",
        },
      },
      variableMeasured: ["River discharge", "Precipitation", "Flow anomaly"],
      keywords: STATIONS.map((s) => `${s.river} at ${s.name}`),
    },
  ];

  return (
    <script
      type="application/ld+json"
      // Server-rendered from our own constants; no user input reaches this string.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}
