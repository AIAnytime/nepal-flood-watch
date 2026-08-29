"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Overview, EmergencyBanner, type SituationData } from "@/components/Overview";
import { FloodMap } from "@/components/FloodMap";
import { FloodStory } from "@/components/FloodStory";
import { Rivers } from "@/components/Rivers";
import { AiOutlook } from "@/components/AiOutlook";
import { News } from "@/components/News";
import { Help } from "@/components/Help";
import { Report } from "@/components/Report";
import { Ask } from "@/components/Ask";
import { Faq } from "@/components/Faq";
import { Footer, Sources } from "@/components/Footer";
import { Section } from "@/components/ui";
import { useApp } from "@/components/Providers";
import { timeAgo } from "@/lib/format";
import type { StationReading } from "@/lib/hydro";
import type { Article } from "@/lib/news";
import type { HazardEvent } from "@/lib/hazards";

export default function Home() {
  const { t, locale } = useApp();

  const [stations, setStations] = useState<StationReading[]>([]);
  const [hazards, setHazards] = useState<HazardEvent[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [situation, setSituation] = useState<SituationData | null>(null);

  const [hydroLoading, setHydroLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [situationLoading, setSituationLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  const load = useCallback((showSpinners = true) => {
    // On first run the spinners are already on from initial state; setting them
    // again synchronously inside the mount effect would just cascade a render.
    if (showSpinners) {
      setHydroLoading(true);
      setNewsLoading(true);
      setSituationLoading(true);
    }

    // Each feed lands independently — a slow news source must never hold up the
    // river data, which is the part people need first.
    void fetch("/api/hydro")
      .then((r) => r.json())
      .then((d) => {
        if (d.stations) {
          setStations(d.stations);
          setUpdatedAt(d.fetchedAt);
        }
      })
      .catch(() => undefined)
      .finally(() => setHydroLoading(false));

    void fetch("/api/hazards")
      .then((r) => r.json())
      .then((d) => d.events && setHazards(d.events))
      .catch(() => undefined);

    void fetch("/api/news")
      .then((r) => r.json())
      .then((d) => d.articles && setArticles(d.articles))
      .catch(() => undefined)
      .finally(() => setNewsLoading(false));

    void fetch("/api/situation")
      .then((r) => r.json())
      .then((d) => !d.error && setSituation(d))
      .catch(() => undefined)
      .finally(() => setSituationLoading(false));
  }, []);

  useEffect(() => {
    // Kicks off the fetches; every state write lands in a promise callback, and the
    // spinners are already on from initial state so nothing is set synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(false);
  }, [load]);

  return (
    <>
      <Header />

      <main className="mx-auto max-w-[1180px] px-4 pb-4 sm:px-6">
        <section id="overview" className="scroll-mt-32 pt-6">
          <div className="mb-5">
            <h1 className="text-[1.75rem] font-bold leading-[1.15] tracking-[-0.035em] sm:text-[2.125rem]">
              {t("app.name")}
            </h1>
            <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-[var(--text-muted)]">
              {t("app.tagline")}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.6875rem] text-[var(--text-faint)]">
              {updatedAt && (
                <span>
                  {t("hero.updated")} {timeAgo(updatedAt, locale)}
                </span>
              )}
              <button
                onClick={() => load()}
                className="font-medium text-[var(--accent-text)] hover:underline"
              >
                {t("hero.refresh")}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <EmergencyBanner />
            <Overview data={situation} loading={situationLoading} />
          </div>
        </section>

        <Section id="map" title={t("map.title")} subtitle={t("map.sub")}>
          <FloodMap stations={stations} hazards={hazards} />
        </Section>

        <Section id="story" title={t("story.title")} subtitle={t("story.sub")}>
          <FloodStory stations={stations} loading={hydroLoading} />
        </Section>

        <Section id="rivers" title={t("rivers.title")} subtitle={t("rivers.sub")}>
          <div className="space-y-4">
            <Rivers stations={stations} loading={hydroLoading} />
            <div>
              <h3 className="mb-3 text-[0.9375rem] font-bold tracking-[-0.01em]">{t("ai.title")}</h3>
              <AiOutlook />
            </div>
          </div>
        </Section>

        <Section id="news" title={t("news.title")} subtitle={t("news.sub")}>
          <News articles={articles} loading={newsLoading} />
        </Section>

        <Section id="help" title={t("help.title")} subtitle={t("help.sub")}>
          <Help />
        </Section>

        <Section id="report" title={t("report.title")} subtitle={t("report.sub")}>
          <Report />
        </Section>

        <Section id="faq" title={t("faq.title")} subtitle={t("faq.sub")}>
          <Faq />
        </Section>

        <Section id="ask" title={t("ask.title")} subtitle={t("ask.sub")}>
          <Ask />
        </Section>

        <Section id="sources" title={t("sources.title")} subtitle={t("sources.sub")}>
          <Sources />
        </Section>
      </main>

      <Footer />
    </>
  );
}
