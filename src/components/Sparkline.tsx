"use client";

/**
 * A 13-day discharge trace: five days of record, then the forecast. The split is
 * drawn explicitly because "what happened" and "what a model expects" should never
 * look like the same line.
 */
export function Sparkline({
  series,
  color,
  pastCount = 5,
}: {
  series: { date: string; flow: number }[];
  color: string;
  pastCount?: number;
}) {
  if (series.length < 2) return <div className="h-8 w-full" />;

  const w = 120;
  const h = 32;
  const pad = 2;
  const values = series.map((p) => p.flow);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const pt = (i: number) => {
    const x = pad + (i / (series.length - 1)) * (w - pad * 2);
    const y = h - pad - ((series[i].flow - min) / span) * (h - pad * 2);
    return [x, y] as const;
  };

  const path = (from: number, to: number) =>
    series
      .slice(from, to)
      .map((_, k) => {
        const [x, y] = pt(from + k);
        return `${k === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const [splitX] = pt(pastCount - 1);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      className="overflow-visible"
      role="img"
      aria-label="Recent and forecast river flow"
    >
      <line
        x1={splitX}
        y1={0}
        x2={splitX}
        y2={h}
        stroke="var(--border-strong)"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <path d={path(0, pastCount)} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
      <path d={path(pastCount - 1, series.length)} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      {(() => {
        const [x, y] = pt(series.length - 1);
        return <circle cx={x} cy={y} r="2.25" fill={color} />;
      })()}
    </svg>
  );
}
