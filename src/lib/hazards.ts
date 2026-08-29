/**
 * Official hazard event feeds: GDACS (EU/UN joint disaster alerts) and USGS
 * seismic events. Both are free and key-free. Seismicity matters here because the
 * 26 Aug event registered as an M5.2 tremor — ground shaking is an early clue to a
 * further slope failure above the dammed lakes.
 */

export type HazardEvent = {
  id: string;
  kind: "gdacs" | "quake";
  title: string;
  severity: string;
  lat: number;
  lon: number;
  time: number;
  url: string;
  detail: string;
};

const NEPAL_BBOX = { minLat: 26, maxLat: 31, minLon: 80, maxLon: 89 };

async function fetchGdacs(signal?: AbortSignal): Promise<HazardEvent[]> {
  try {
    const from = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    const to = new Date().toISOString().slice(0, 10);
    const url = `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?fromDate=${from}&toDate=${to}&country=Nepal`;
    const res = await fetch(url, { signal, next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const data = await res.json();
    const features = data?.features ?? [];
    return features.map((f: Record<string, never>): HazardEvent => {
      const p = (f as unknown as { properties: Record<string, string> }).properties;
      const g = (f as unknown as { geometry: { coordinates: number[] } }).geometry;
      return {
        id: `gdacs-${p.eventid}-${p.episodeid}`,
        kind: "gdacs",
        title: String(p.name || p.description || "GDACS event"),
        severity: String(p.alertlevel ?? "Green"),
        lon: g?.coordinates?.[0] ?? 0,
        lat: g?.coordinates?.[1] ?? 0,
        time: new Date(String(p.fromdate ?? Date.now())).getTime(),
        url: `https://www.gdacs.org/report.aspx?eventid=${p.eventid}&eventtype=${p.eventtype}`,
        detail: String(p.htmldescription ?? "").replace(/<[^>]*>/g, " ").trim(),
      };
    });
  } catch (err) {
    console.error("[hazards] gdacs failed:", err);
    return [];
  }
}

async function fetchQuakes(signal?: AbortSignal): Promise<HazardEvent[]> {
  try {
    const start = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    const url =
      `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${start}` +
      `&minlatitude=${NEPAL_BBOX.minLat}&maxlatitude=${NEPAL_BBOX.maxLat}` +
      `&minlongitude=${NEPAL_BBOX.minLon}&maxlongitude=${NEPAL_BBOX.maxLon}&minmagnitude=3.5`;
    const res = await fetch(url, { signal, next: { revalidate: 1800 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.features ?? []).map((f: Record<string, never>): HazardEvent => {
      const p = (f as unknown as { properties: Record<string, string | number> }).properties;
      const g = (f as unknown as { geometry: { coordinates: number[] } }).geometry;
      return {
        id: `quake-${(f as unknown as { id: string }).id}`,
        kind: "quake",
        title: `M${p.mag} — ${p.place}`,
        severity: Number(p.mag) >= 5 ? "Orange" : "Green",
        lon: g?.coordinates?.[0] ?? 0,
        lat: g?.coordinates?.[1] ?? 0,
        time: Number(p.time),
        url: String(p.url),
        detail: `Magnitude ${p.mag} earthquake, depth ${g?.coordinates?.[2] ?? "?"} km.`,
      };
    });
  } catch (err) {
    console.error("[hazards] usgs failed:", err);
    return [];
  }
}

export async function fetchHazards(signal?: AbortSignal) {
  const [gdacs, quakes] = await Promise.all([fetchGdacs(signal), fetchQuakes(signal)]);
  return {
    events: [...gdacs, ...quakes].sort((a, b) => b.time - a.time).slice(0, 30),
    fetchedAt: Date.now(),
  };
}
