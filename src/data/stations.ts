/**
 * Monitoring points. The Rasuwa / Nuwakot cluster sits along the Bhotekoshi–Trishuli
 * corridor hit by the 26 Aug 2026 debris avalanche and flash flood. The rest are
 * Nepal's major river basins, kept under watch for the remainder of the monsoon.
 *
 * NOTE: no hard-coded warning levels live here on purpose. Official danger levels are
 * published by Nepal's DHM and we do not restate them. Risk in this app is a *relative
 * flow anomaly*, computed at request time from each point's own recent record.
 */
export type Station = {
  id: string;
  name: string;
  nameNe: string;
  nameHi: string;
  river: string;
  district: string;
  lat: number;
  lon: number;
  /** In the corridor directly hit on 26 Aug 2026. */
  focus: boolean;
  /**
   * Distance downstream along FLOOD_PATH from the collapse zone, in kilometres.
   * Measured against the real river geometry; null for points on other rivers.
   */
  downstreamKm: number | null;
};

export const STATIONS: Station[] = [
  { id: "timure", name: "Timure / Rasuwagadhi", nameNe: "टिमुरे / रसुवागढी", nameHi: "टिमुरे / रसुवागढ़ी", river: "Bhotekoshi", district: "Rasuwa", lat: 28.28, lon: 85.38, focus: true, downstreamKm: 0 },
  { id: "syabrubesi", name: "Syabrubesi", nameNe: "स्याफ्रुबेंसी", nameHi: "स्याफ्रुबेसी", river: "Bhotekoshi", district: "Rasuwa", lat: 28.16, lon: 85.33, focus: true, downstreamKm: 15 },
  { id: "dhunche", name: "Dhunche", nameNe: "धुन्चे", nameHi: "धुन्चे", river: "Trishuli", district: "Rasuwa", lat: 28.11, lon: 85.30, focus: true, downstreamKm: 22 },
  { id: "betrawati", name: "Betrawati", nameNe: "बेत्रावती", nameHi: "बेत्रावती", river: "Trishuli", district: "Nuwakot", lat: 27.97, lon: 85.18, focus: true, downstreamKm: 45 },
  { id: "trishuli-bazar", name: "Trishuli Bazar", nameNe: "त्रिशूली बजार", nameHi: "त्रिशूली बाज़ार", river: "Trishuli", district: "Nuwakot", lat: 27.93, lon: 85.15, focus: true, downstreamKm: 51 },
  { id: "devghat", name: "Devghat", nameNe: "देवघाट", nameHi: "देवघाट", river: "Narayani", district: "Chitwan", lat: 27.71, lon: 84.42, focus: true, downstreamKm: 177 },
  { id: "khokana", name: "Khokana", nameNe: "खोकना", nameHi: "खोकना", river: "Bagmati", district: "Lalitpur", lat: 27.63, lon: 85.29, focus: false, downstreamKm: null },
  { id: "chatara", name: "Chatara", nameNe: "चतरा", nameHi: "चतरा", river: "Koshi", district: "Sunsari", lat: 26.87, lon: 87.15, focus: false, downstreamKm: null },
  { id: "chisapani", name: "Chisapani", nameNe: "चिसापानी", nameHi: "चिसापानी", river: "Karnali", district: "Bardiya", lat: 28.64, lon: 81.29, focus: false, downstreamKm: null },
  { id: "kusum", name: "Kusum", nameNe: "कुसुम", nameHi: "कुसुम", river: "West Rapti", district: "Banke", lat: 28.13, lon: 81.90, focus: false, downstreamKm: null },
  { id: "rajaiya", name: "Rajaiya", nameNe: "राजैया", nameHi: "राजैया", river: "East Rapti", district: "Makwanpur", lat: 27.55, lon: 85.00, focus: false, downstreamKm: null },
  { id: "kotagaun", name: "Kotagaun", nameNe: "कोटगाउँ", nameHi: "कोटगाँव", river: "Kaligandaki", district: "Nawalparasi", lat: 27.70, lon: 83.60, focus: false, downstreamKm: null },
];

/**
 * The two landslide-dammed lakes formed by the 26 Aug 2026 debris avalanche are the
 * active secondary hazard. Their positions are NOT precisely published, so this is a
 * broad advisory zone over the reported reach — rendered as an uncertainty circle and
 * labelled as approximate. Never present this as a surveyed location.
 */
export const DAM_LAKE_ZONE = {
  id: "bhotekoshi-dam-lakes",
  lat: 28.21,
  lon: 85.35,
  radiusMeters: 9000,
  river: "Bhotekoshi",
  approximate: true as const,
};
