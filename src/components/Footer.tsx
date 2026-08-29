"use client";

import { useApp } from "./Providers";

const SOURCES = [
  { name: "Open-Meteo Flood API", what: "Copernicus GloFAS river discharge, key-free", url: "https://open-meteo.com/en/docs/flood-api" },
  { name: "Open-Meteo Weather API", what: "ECMWF & GFS rainfall forecasts", url: "https://open-meteo.com/" },
  { name: "GDACS", what: "EU/UN global disaster alerts", url: "https://www.gdacs.org/" },
  { name: "USGS Earthquake API", what: "Seismic events near the affected slopes", url: "https://earthquake.usgs.gov/fdsnws/event/1/" },
  { name: "ReliefWeb (OCHA)", what: "Humanitarian situation reports", url: "https://reliefweb.int/country/npl" },
  { name: "Kathmandu Post, OnlineKhabar, Himalayan Times", what: "Nepali newsroom RSS feeds", url: "https://kathmandupost.com/" },
  { name: "OpenStreetMap", what: "Base map tiles", url: "https://www.openstreetmap.org/copyright" },
  { name: "Groq", what: "AI Agents for analysis, screening and Q&A", url: "https://groq.com/" },
];

export function Sources() {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
      {SOURCES.map((s) => (
        <a
          key={s.name}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className="card group p-3 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-sunken)]"
        >
          <div className="text-[0.75rem] font-semibold leading-snug group-hover:text-[var(--accent-text)]">
            {s.name}
          </div>
          <div className="mt-1 text-[0.6875rem] leading-snug text-[var(--text-muted)]">{s.what}</div>
        </a>
      ))}
    </div>
  );
}

export function Footer() {
  const { t } = useApp();
  return (
    <footer className="mt-6 border-t border-[var(--border)] bg-[var(--bg-elev)]">
      <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6">
        <div className="mb-5">
          <p className="text-[0.75rem] leading-relaxed text-[var(--text-muted)] max-w-2xl">
            {t("common.disclaimer")}
          </p>
        </div>

        <div className="hairline flex flex-col items-center gap-4 pt-6 sm:flex-row sm:justify-between">
          <p className="flex items-center gap-1.5 text-[0.875rem] font-medium">
            {t("footer.built")}
            <span aria-label="love" className="text-[1rem]">
              ❤️
            </span>
          </p>

          <div className="flex items-center gap-2">
            <a
              href="https://www.youtube.com/@AIAnytime"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost !py-1.5 !text-[0.75rem]"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M23 12s0-3.9-.5-5.7a3 3 0 0 0-2.1-2.1C18.6 3.7 12 3.7 12 3.7s-6.6 0-8.4.5A3 3 0 0 0 1.5 6.3C1 8.1 1 12 1 12s0 3.9.5 5.7a3 3 0 0 0 2.1 2.1c1.8.5 8.4.5 8.4.5s6.6 0 8.4-.5a3 3 0 0 0 2.1-2.1C23 15.9 23 12 23 12ZM9.8 15.4V8.6l5.9 3.4-5.9 3.4Z" />
              </svg>
              YouTube
            </a>
            <a
              href="https://github.com/AIAnytime"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost !py-1.5 !text-[0.75rem]"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M12 1.5a10.5 10.5 0 0 0-3.3 20.5c.5.1.7-.2.7-.5v-1.9c-2.9.6-3.5-1.4-3.5-1.4-.5-1.2-1.2-1.5-1.2-1.5-.9-.7.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.3-.3-4.8-1.2-4.8-5.2 0-1.2.4-2.1 1.1-2.9-.1-.3-.5-1.4.1-2.9 0 0 .9-.3 2.9 1.1a10 10 0 0 1 5.3 0c2-1.4 2.9-1.1 2.9-1.1.6 1.5.2 2.6.1 2.9.7.8 1.1 1.7 1.1 2.9 0 4-2.5 4.9-4.8 5.2.4.3.7 1 .7 2v3c0 .3.2.6.7.5A10.5 10.5 0 0 0 12 1.5Z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
