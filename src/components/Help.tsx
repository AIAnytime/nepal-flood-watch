"use client";

import { useApp, pick } from "./Providers";
import { Callout } from "./ui";
import { HELPLINES, RELIEF_ORGS } from "@/lib/helplines";

const SAFETY_STEPS = {
  en: [
    "Move to the highest nearby ground immediately — do not wait for an official warning.",
    "Never walk or drive through moving water; 15 cm of flow can knock an adult over.",
    "Stay off riverbanks and out of gorges in Rasuwa and Nuwakot — dammed lakes upstream can release without warning.",
    "Keep your phone charged and share your location with family before you lose signal.",
    "Treat all flood water as contaminated. Boil or purify drinking water.",
    "If someone is missing, call 100 and file a report with the local police, then post here.",
  ],
  ne: [
    "तुरुन्तै नजिकैको अग्लो ठाउँमा जानुहोस् — आधिकारिक चेतावनी नकुर्नुहोस्।",
    "बगिरहेको पानीमा कहिल्यै नहिँड्नुहोस् वा सवारी नचलाउनुहोस्; १५ सेन्टिमिटर बहावले वयस्कलाई लडाउन सक्छ।",
    "रसुवा र नुवाकोटका नदी किनार तथा खोँचबाट टाढा रहनुहोस् — माथिका बाँधिएका तालहरू बिना चेतावनी फुट्न सक्छन्।",
    "फोन चार्ज राख्नुहोस् र सिग्नल जानुअघि आफ्नो स्थान परिवारलाई पठाउनुहोस्।",
    "बाढीको सबै पानी दूषित मान्नुहोस्। पिउने पानी उमालेर वा शुद्ध गरेर मात्र पिउनुहोस्।",
    "कोही बेपत्ता भए १०० मा फोन गरी स्थानीय प्रहरीमा उजुरी दिनुहोस्, त्यसपछि यहाँ पनि राख्नुहोस्।",
  ],
  hi: [
    "तुरंत पास की सबसे ऊँची जगह पर जाएँ — आधिकारिक चेतावनी का इंतज़ार न करें।",
    "बहते पानी में कभी न चलें और न वाहन ले जाएँ; 15 सेंटीमीटर बहाव एक वयस्क को गिरा सकता है।",
    "रसुवा और नुवाकोट में नदी किनारों और घाटियों से दूर रहें — ऊपर बनी बाँध झीलें बिना चेतावनी फूट सकती हैं।",
    "फ़ोन चार्ज रखें और सिग्नल जाने से पहले अपनी लोकेशन परिवार को भेजें।",
    "बाढ़ के सारे पानी को दूषित मानें। पीने का पानी उबालकर या शुद्ध करके ही लें।",
    "कोई लापता हो तो 100 पर कॉल कर स्थानीय पुलिस में रिपोर्ट करें, फिर यहाँ भी पोस्ट करें।",
  ],
};

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.5 3h3l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2L21 14.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 5.2 2 2 0 0 1 6 3Z" />
    </svg>
  );
}

export function Help() {
  const { t, locale } = useApp();
  const priority = HELPLINES.filter((h) => h.priority);
  const rest = HELPLINES.filter((h) => !h.priority);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {priority.map((h) => (
          <a
            key={h.id}
            href={`tel:${h.number}`}
            className="card group flex items-center gap-3.5 p-4 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-sunken)]"
            style={{ borderColor: "color-mix(in srgb, var(--severe) 25%, var(--border))" }}
          >
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] text-[1rem] font-bold tabular-nums"
              style={{ background: "var(--severe-soft)", color: "var(--severe)" }}
            >
              {h.number}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.8125rem] font-semibold leading-snug">
                {pick(h, "label", locale)}
              </span>
              <span className="mt-0.5 block text-[0.6875rem] leading-snug text-[var(--text-muted)]">
                {pick(h, "note", locale)}
              </span>
            </span>
            <span
              className="shrink-0 transition-transform group-hover:translate-x-0.5"
              style={{ color: "var(--severe)" }}
            >
              <PhoneIcon />
            </span>
          </a>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((h) => (
          <a
            key={h.id}
            href={`tel:${h.number}`}
            className="card group flex items-center gap-3 p-3 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-sunken)]"
          >
            <span className="flex h-9 w-11 shrink-0 items-center justify-center rounded-[8px] bg-[var(--bg-sunken)] text-[0.8125rem] font-bold tabular-nums text-[var(--text)]">
              {h.number}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.75rem] font-semibold leading-snug truncate">
                {pick(h, "label", locale)}
              </span>
              <span className="block text-[0.6875rem] leading-snug text-[var(--text-faint)] truncate">
                {pick(h, "note", locale)}
              </span>
            </span>
          </a>
        ))}
      </div>

      <Callout tone="warn">{t("help.verify")}</Callout>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4 sm:p-5">
          <h3 className="text-[0.9375rem] font-bold tracking-[-0.01em]">{t("help.what")}</h3>
          <ol className="mt-3 space-y-2.5">
            {SAFETY_STEPS[locale].map((step, i) => (
              <li key={i} className="flex gap-3 text-[0.8125rem] leading-relaxed">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[0.6875rem] font-bold text-[var(--accent-text)] tabular-nums">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="card p-4 sm:p-5">
          <h3 className="text-[0.9375rem] font-bold tracking-[-0.01em]">{t("help.orgs")}</h3>
          <ul className="mt-3 space-y-2">
            {RELIEF_ORGS.map((o) => (
              <li key={o.name}>
                <a
                  href={o.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start justify-between gap-3 rounded-[8px] px-2.5 py-2 -mx-2.5 transition-colors hover:bg-[var(--bg-sunken)]"
                >
                  <span className="min-w-0">
                    <span className="block text-[0.8125rem] font-semibold leading-snug group-hover:text-[var(--accent-text)]">
                      {o.name}
                    </span>
                    <span className="block text-[0.6875rem] leading-snug text-[var(--text-muted)]">
                      {pick(o, "what", locale)}
                    </span>
                  </span>
                  <svg viewBox="0 0 24 24" width="13" height="13" className="mt-1 shrink-0 text-[var(--text-faint)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
