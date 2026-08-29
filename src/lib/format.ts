import type { Locale } from "./i18n";

/**
 * Chrome ships no CLDR data for Nepali: `Intl.RelativeTimeFormat("ne")` and
 * `Intl.DateTimeFormat("ne")` both silently resolve to en-US, so a Nepali reader
 * would get English dates on an otherwise Nepali page. Node and some browsers DO
 * have the data, so rather than hard-coding a fallback we detect the miss at
 * runtime and supply Nepali ourselves only when the platform has let us down.
 */
function supports(locale: string, make: (l: string) => { resolvedOptions(): { locale: string } }) {
  try {
    return make(locale).resolvedOptions().locale.split("-")[0] === locale;
  } catch {
    return false;
  }
}

const NE_RELATIVE_OK = supports("ne", (l) => new Intl.RelativeTimeFormat(l));
const NE_DATE_OK = supports("ne", (l) => new Intl.DateTimeFormat(l));

const NE_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
const NE_MONTHS = [
  "जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन",
  "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर",
];

function neNum(n: number): string {
  return String(n).replace(/\d/g, (d) => NE_DIGITS[Number(d)]);
}

function neAgo(ts: number): string {
  const secs = Math.round((Date.now() - ts) / 1000);
  if (secs < 60) return "भर्खरै";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${neNum(mins)} मिनेट अघि`;
  const hours = Math.round(secs / 3600);
  if (hours < 24) return `${neNum(hours)} घण्टा अघि`;
  const days = Math.round(secs / 86400);
  if (days === 1) return "हिजो";
  return `${neNum(days)} दिन अघि`;
}

function intlLocale(locale: Locale): string {
  return locale === "en" ? "en-GB" : locale;
}

export function timeAgo(ts: number, locale: Locale): string {
  if (locale === "ne" && !NE_RELATIVE_OK) return neAgo(ts);

  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" });
  const diff = ts - Date.now();
  const mins = Math.round(diff / 60_000);
  if (Math.abs(mins) < 60) return rtf.format(mins, "minute");
  const hours = Math.round(diff / 3_600_000);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  return rtf.format(Math.round(diff / 86_400_000), "day");
}

export function clockTime(ts: number, locale: Locale): string {
  if (locale === "ne" && !NE_DATE_OK) {
    const d = new Date(ts);
    return `${neNum(d.getDate())} ${NE_MONTHS[d.getMonth()]}, ${neNum(d.getHours())}:${String(
      d.getMinutes()
    ).padStart(2, "0").replace(/\d/g, (x) => NE_DIGITS[Number(x)])}`;
  }
  return new Intl.DateTimeFormat(intlLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(ts);
}

/** For outlets that publish a date but no time — never imply precision we lack. */
export function dayOnly(ts: number, locale: Locale): string {
  if (locale === "ne" && !NE_DATE_OK) {
    const d = new Date(ts);
    return `${neNum(d.getDate())} ${NE_MONTHS[d.getMonth()]}`;
  }
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "short",
  }).format(ts);
}

/** Discharge numbers span three orders of magnitude across Nepal's basins. */
export function flow(v: number | null): string {
  if (v === null || !Number.isFinite(v)) return "—";
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  if (v >= 100) return v.toFixed(0);
  return v.toFixed(1);
}
