"use client";

import { useEffect, useRef, useState } from "react";
import type * as L from "leaflet";
import { useApp, pick } from "./Providers";
import { RISK_COLORS } from "./ui";
import { DAM_LAKE_ZONE } from "@/data/stations";
import { FLOOD_ORIGIN, FLOOD_PATH } from "@/data/floodpath";
import type { StationReading } from "@/lib/hydro";
import type { HazardEvent } from "@/lib/hazards";

/**
 * Leaflet is loaded from the CDN at runtime rather than bundled: it touches
 * `window` at import time and would break the server render.
 */
declare global {
  interface Window {
    L?: typeof L;
  }
}

function loadLeaflet(): Promise<typeof L> {
  if (window.L) return Promise.resolve(window.L);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-leaflet]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.L!));
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    script.crossOrigin = "";
    script.dataset.leaflet = "true";
    script.onload = () => resolve(window.L!);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Three ways of looking at the same valley. Terrain is the default because the
 * story here is topographic — a wall of water funnelled down a steep Himalayan
 * gorge — and a flat street map hides exactly the thing that made it lethal.
 */
type BaseKey = "terrain" | "satellite" | "plain";

/**
 * Dark mode is handled per layer rather than with one blanket filter. Inverting
 * line art works; inverting a photograph or an elevation-tinted topo map does not
 * — it turns forest pink and snow brown. So the plain layer swaps to a real dark
 * tileset, while terrain and satellite are only dimmed to sit correctly against a
 * dark page.
 */
const BASEMAPS: Record<
  BaseKey,
  {
    url: string;
    darkUrl?: string;
    attribution: string;
    maxZoom: number;
    dark: "dim" | "swap";
  }
> = {
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors, SRTM | &copy; OpenTopoMap (CC-BY-SA)",
    maxZoom: 16,
    dark: "dim",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics",
    maxZoom: 17,
    dark: "dim",
  },
  plain: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    darkUrl: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    maxZoom: 18,
    dark: "swap",
  },
};

/** Plain words instead of a multiplier — most people do not read "1.6×" as danger. */
function plainLevel(s: StationReading, t: (k: string) => string): string {
  return t(`plain.${s.risk}`);
}

export function FloodMap({
  stations,
  hazards,
}: {
  stations: StationReading[];
  hazards: HazardEvent[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const fittedRef = useRef(false);
  const { locale, t, theme } = useApp();
  const [base, setBase] = useState<BaseKey>("terrain");
  /**
   * Leaflet arrives asynchronously from the CDN, so the map does not exist during
   * the first render. The layer and marker effects below key off this flag —
   * without it they run once against a null map and never fire again.
   */
  const [mapReady, setMapReady] = useState(false);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((leaflet) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const map = leaflet.map(containerRef.current, {
          center: [28.0, 85.25],
          zoom: 9,
          minZoom: 6,
          scrollWheelZoom: false,
          attributionControl: true,
          // Leaflet fades tiles in by animating inline opacity from 0. If that
          // animation frame is interrupted — a React re-render lands mid-fade, or
          // the tab is backgrounded — tiles stay stuck at opacity 0 and the map
          // renders blank despite every tile having loaded. Painting them
          // immediately avoids the whole failure mode, and suits reduced-motion.
          fadeAnimation: false,
        });
        // Wheel zoom only after a deliberate click, so the page still scrolls past it.
        map.on("click", () => map.scrollWheelZoom.enable());
        map.on("mouseout", () => map.scrollWheelZoom.disable());
        mapRef.current = map;
        markerLayerRef.current = leaflet.layerGroup().addTo(map);
        setMapReady(true);
      })
      .catch((err) => console.error("[map] leaflet failed to load:", err));

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      baseLayerRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Swap the base layer when the viewer picks a different one.
  useEffect(() => {
    const leaflet = window.L;
    const map = mapRef.current;
    if (!leaflet || !map) return;

    if (!mapReady) return;

    const spec = BASEMAPS[base];
    const dark = theme === "dark";
    const layer = leaflet.tileLayer(dark && spec.darkUrl ? spec.darkUrl : spec.url, {
      attribution: spec.attribution,
      maxZoom: spec.maxZoom,
    });
    layer.addTo(map);
    layer.getContainer()?.classList.toggle("tile-dim", dark && spec.dark === "dim");
    baseLayerRef.current?.remove();
    baseLayerRef.current = layer;
  }, [base, mapReady, theme]);

  // Redraw everything above the tiles whenever data or language changes.
  useEffect(() => {
    const leaflet = window.L;
    const layer = markerLayerRef.current;
    if (!leaflet || !layer) return;
    layer.clearLayers();

    // The path the water took. Drawn as a wide translucent casing under a bright
    // core so it stays legible over both satellite imagery and topo shading.
    leaflet
      .polyline(FLOOD_PATH, { color: "#000", weight: 8, opacity: 0.25 })
      .addTo(layer);
    leaflet
      .polyline(FLOOD_PATH, { color: "var(--severe)", weight: 3.5, opacity: 0.95 })
      .bindPopup(
        `<strong>${t("map.pathTitle")}</strong><br><span style="opacity:.75">${t("map.pathBody")}</span>`
      )
      .addTo(layer);

    // Where it started.
    leaflet
      .marker([FLOOD_ORIGIN.lat, FLOOD_ORIGIN.lon], {
        icon: leaflet.divIcon({
          className: "",
          html:
            `<div style="display:flex;align-items:center;gap:5px;transform:translate(-11px,-11px)">` +
            `<div style="width:22px;height:22px;border-radius:50%;background:var(--severe);border:2.5px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:800">!</div>` +
            `</div>`,
          iconSize: [22, 22],
          iconAnchor: [0, 0],
        }),
        zIndexOffset: 1000,
      })
      .bindPopup(
        `<strong>${t("map.originTitle")}</strong><br><span style="opacity:.75">${t("map.originBody")}</span>`
      )
      .addTo(layer);

    // Advisory zone for the landslide-dammed lakes — deliberately a wide, soft
    // circle, since the real positions are not publicly surveyed. A white casing
    // under the dashes keeps it readable over satellite imagery and topo shading
    // alike, where a thin red line alone disappears.
    leaflet
      .circle([DAM_LAKE_ZONE.lat, DAM_LAKE_ZONE.lon], {
        radius: DAM_LAKE_ZONE.radiusMeters,
        color: "#fff",
        weight: 5,
        opacity: 0.55,
        fill: false,
      })
      .addTo(layer);
    leaflet
      .circle([DAM_LAKE_ZONE.lat, DAM_LAKE_ZONE.lon], {
        radius: DAM_LAKE_ZONE.radiusMeters,
        color: "var(--severe)",
        weight: 2.5,
        dashArray: "7 6",
        fillColor: "var(--severe)",
        fillOpacity: 0.14,
      })
      .bindPopup(
        `<strong>${t("map.lakesTitle")}</strong><br><span style="opacity:.75">${t("map.lakesBody")}</span>`
      )
      .addTo(layer);

    for (const s of stations) {
      const color = RISK_COLORS[s.risk];
      const r = s.risk === "severe" ? 11 : s.risk === "high" ? 9 : s.focus ? 8 : 6;
      leaflet
        .circleMarker([s.lat, s.lon], {
          radius: r,
          color: "#fff",
          weight: 2,
          fillColor: color,
          fillOpacity: 0.95,
        })
        .bindPopup(
          `<strong>${pick(s, "name", locale)}</strong><br>` +
            `<span style="opacity:.75">${s.river} · ${s.district}</span><br><br>` +
            `<span style="color:${color};font-weight:700;font-size:13px">${plainLevel(s, t)}</span><br>` +
            `<span style="opacity:.75">${t("plain.rainNext")}: ${s.rain3d} mm</span>` +
            (s.downstreamKm !== null
              ? `<br><span style="opacity:.75">${s.downstreamKm} km ${t("plain.downstream")}</span>`
              : "")
        )
        .addTo(layer);
    }

    if (!fittedRef.current && stations.length) {
      // Frame the districts actually struck on 26 Aug. Devghat is flagged focus
      // because it is downstream on the Narayani, but including it drags the view
      // far south-west and pushes the corridor off the top of the map.
      const focus = stations.filter(
        (s) => s.district === "Rasuwa" || s.district === "Nuwakot"
      );
      if (focus.length) {
        mapRef.current?.fitBounds(
          leaflet.latLngBounds(focus.map((s) => [s.lat, s.lon] as [number, number])),
          { padding: [56, 56], maxZoom: 11 }
        );
        fittedRef.current = true;
      }
    }

    for (const h of hazards.slice(0, 12)) {
      if (!h.lat && !h.lon) continue;
      leaflet
        .marker([h.lat, h.lon], {
          icon: leaflet.divIcon({
            className: "",
            html: `<div style="width:18px;height:18px;border-radius:50%;background:var(--bg-elev);border:2px solid ${
              h.kind === "quake" ? "var(--moderate)" : "var(--high)"
            };display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:${
              h.kind === "quake" ? "var(--moderate)" : "var(--high)"
            }">${h.kind === "quake" ? "M" : "!"}</div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          }),
        })
        .bindPopup(
          `<strong>${h.title}</strong><br><span style="opacity:.75">${h.detail.slice(0, 220)}</span><br><br>` +
            `<a href="${h.url}" target="_blank" rel="noopener noreferrer" style="color:var(--accent)">${h.kind === "quake" ? "USGS" : "GDACS"} →</a>`
        )
        .addTo(layer);
    }
  }, [stations, hazards, locale, t, mapReady]);

  const baseOptions: { key: BaseKey; label: string }[] = [
    { key: "terrain", label: t("map.terrain") },
    { key: "satellite", label: t("map.satellite") },
    { key: "plain", label: t("map.plain") },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] p-3">
        <p className="text-[0.75rem] leading-relaxed text-[var(--text-muted)]">
          {t("map.help")}
        </p>
        <div
          className="flex items-center rounded-[10px] border border-[var(--border-strong)] bg-[var(--bg)] p-0.5"
          role="group"
          aria-label={t("map.layer")}
        >
          {baseOptions.map((o) => (
            <button
              key={o.key}
              onClick={() => setBase(o.key)}
              aria-pressed={base === o.key}
              className={`rounded-[7px] px-2.5 py-1 text-[0.6875rem] font-semibold transition-colors ${
                base === o.key
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        className="h-[360px] w-full sm:h-[460px]"
        style={{ zIndex: 0 }}
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--border)] p-3 text-[0.6875rem] text-[var(--text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full border-2 border-white"
            style={{ background: "var(--severe)", boxShadow: "0 0 0 1px var(--border-strong)" }}
          />
          {t("map.legendOrigin")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5 rounded" style={{ background: "var(--severe)" }} />
          {t("map.legendPath")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full border-[1.5px] border-dashed"
            style={{ borderColor: "var(--severe)" }}
          />
          {t("map.legendLakes")}
        </span>
        <span className="mx-1 hidden h-3 w-px bg-[var(--border)] sm:inline-block" />
        {(["severe", "high", "moderate", "normal"] as const).map((lvl) => (
          <span key={lvl} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full border-2 border-white"
              style={{ background: RISK_COLORS[lvl], boxShadow: "0 0 0 1px var(--border-strong)" }}
            />
            {t(`plain.${lvl}`)}
          </span>
        ))}
      </div>
    </div>
  );
}
