import { STATIONS, type Station } from "@/data/stations";

/**
 * River discharge from the Copernicus GloFAS model and rainfall from ECMWF/GFS,
 * both served key-free by Open-Meteo.
 *
 * Risk here is deliberately *relative*: each point is compared against its own
 * discharge over the preceding weeks. That avoids publishing invented absolute
 * danger thresholds — only Nepal's DHM can set those.
 */

export type RiskLevel = "severe" | "high" | "moderate" | "normal" | "unknown";

export type StationReading = Station & {
  current: number | null;
  peak7d: number | null;
  baseline: number | null;
  /**
   * True when the GloFAS cell under this point carries very little flow. The model
   * runs on ~5 km cells, so a headwater point can land on a side tributary rather
   * than the main stem. The absolute discharge is then not the river's flow and is
   * shown as such — the anomaly ratio below is scale-free and stays meaningful.
   */
  coarseCell: boolean;
  /** peak7d / baseline. 1.0 means the forecast peak matches the recent norm. */
  anomaly: number | null;
  rain3d: number | null;
  rain72hPast: number | null;
  risk: RiskLevel;
  series: { date: string; flow: number }[];
};

const FLOOD_API = "https://flood-api.open-meteo.com/v1/flood";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

type FloodResponse = {
  daily: {
    time: string[];
    river_discharge: (number | null)[];
    river_discharge_max: (number | null)[];
  };
};

type WeatherResponse = {
  daily: { time: string[]; precipitation_sum: (number | null)[] };
};

function median(values: number[]): number | null {
  const clean = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (!clean.length) return null;
  const mid = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[mid] : (clean[mid - 1] + clean[mid]) / 2;
}

function classify(anomaly: number | null, rain3d: number | null): RiskLevel {
  if (anomaly === null) return "unknown";
  // Heavy incoming rain nudges a borderline point up one band.
  const wet = (rain3d ?? 0) >= 120;
  if (anomaly >= 2.2) return "severe";
  if (anomaly >= 1.6) return wet ? "severe" : "high";
  if (anomaly >= 1.25) return wet ? "high" : "moderate";
  if (anomaly >= 1.05 && wet) return "moderate";
  return "normal";
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return (await res.json()) as T;
}

export async function fetchHydrology(signal?: AbortSignal): Promise<{
  stations: StationReading[];
  fetchedAt: number;
}> {
  const lats = STATIONS.map((s) => s.lat).join(",");
  const lons = STATIONS.map((s) => s.lon).join(",");

  const floodUrl =
    `${FLOOD_API}?latitude=${lats}&longitude=${lons}` +
    `&daily=river_discharge,river_discharge_max&past_days=60&forecast_days=14`;
  const weatherUrl =
    `${WEATHER_API}?latitude=${lats}&longitude=${lons}` +
    `&daily=precipitation_sum&past_days=3&forecast_days=7&timezone=Asia%2FKathmandu`;

  const [floods, weathers] = await Promise.all([
    getJson<FloodResponse[] | FloodResponse>(floodUrl, signal),
    getJson<WeatherResponse[] | WeatherResponse>(weatherUrl, signal),
  ]);

  const floodList = Array.isArray(floods) ? floods : [floods];
  const weatherList = Array.isArray(weathers) ? weathers : [weathers];

  const stations = STATIONS.map((station, i): StationReading => {
    const flood = floodList[i];
    const weather = weatherList[i];

    const times = flood?.daily?.time ?? [];
    const flow = flood?.daily?.river_discharge ?? [];
    const flowMax = flood?.daily?.river_discharge_max ?? [];

    const todayIdx = (() => {
      const today = new Date().toISOString().slice(0, 10);
      const exact = times.indexOf(today);
      return exact === -1 ? Math.max(0, times.length - 15) : exact;
    })();

    const current = flow[todayIdx] ?? null;

    // Baseline: median daily flow over the 45 days before the forecast window.
    const past = flow.slice(Math.max(0, todayIdx - 45), todayIdx).filter((v): v is number => v !== null);
    const baseline = median(past);

    const forward = flowMax
      .slice(todayIdx, todayIdx + 8)
      .filter((v): v is number => v !== null);
    const peak7d = forward.length ? Math.max(...forward) : null;

    const anomaly = baseline && peak7d && baseline > 0 ? peak7d / baseline : null;

    const rainDaily = weather?.daily?.precipitation_sum ?? [];
    const rainTimes = weather?.daily?.time ?? [];
    const rainToday = Math.max(0, rainTimes.indexOf(new Date().toISOString().slice(0, 10)));
    const rain3d = rainDaily
      .slice(rainToday, rainToday + 3)
      .reduce<number>((a, v) => a + (v ?? 0), 0);
    const rain72hPast = rainDaily
      .slice(Math.max(0, rainToday - 3), rainToday)
      .reduce<number>((a, v) => a + (v ?? 0), 0);

    const series = times
      .slice(Math.max(0, todayIdx - 5), todayIdx + 8)
      .map((date, k) => ({
        date,
        flow: flow[Math.max(0, todayIdx - 5) + k] ?? 0,
      }));

    return {
      ...station,
      current,
      peak7d,
      baseline,
      anomaly,
      rain3d: Number(rain3d.toFixed(1)),
      rain72hPast: Number(rain72hPast.toFixed(1)),
      coarseCell: baseline !== null && baseline < 20,
      risk: classify(anomaly, rain3d),
      series,
    };
  });

  return { stations, fetchedAt: Date.now() };
}
