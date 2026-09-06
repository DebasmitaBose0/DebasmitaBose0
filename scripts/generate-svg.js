import fs from "fs";

const payload = JSON.parse(fs.readFileSync("data/contributions.json", "utf8"));
const contributions = (payload.contributions || [])
  .map(d => ({ date: d.date, count: Number(d.count || 0) }))
  .sort((a, b) => a.date.localeCompare(b.date));

// One real point for every day in the latest 365 days.
const points = contributions.slice(-365);
const width = 1100;
const height = 380;
const left = 78;
const right = 72;
const top = 72;
const bottom = 62;
const plotWidth = width - left - right;
const plotHeight = height - top - bottom;
const maxValue = Math.max(...points.map(p => p.count), 0);
const yMax = Math.max(1, maxValue);

const x = i => points.length > 1
  ? left + (i / (points.length - 1)) * plotWidth
  : left;
const y = value => top + plotHeight - (value / yMax) * plotHeight;

// Smooth Catmull-Rom style curve through every daily data point.
function smoothPath(values) {
  if (values.length < 2) return values.length ? `M ${x(0)} ${y(values[0].count)}` : "";
  let path = `M ${x(0)} ${y(values[0].count)}`;
  for (let i = 0; i < values.length - 1; i++) {
    const p0 = values[Math.max(0, i - 1)];
    const p1 = values[i];
    const p2 = values[i + 1];
    const p3 = values[Math.min(values.length - 1, i + 2)];
    const x1 = x(i), y1 = y(p1.count);
    const x2 = x(i + 1), y2 = y(p2.count);
    const c1x = x1 + (x2 - x(p0 === p1 ? i : i - 1)) / 6;
    const c1y = y1 + (y(p0.count) - y2) / 6;
    const c2x = x2 - (x(Math.min(values.length - 1, i + 2)) - x1) / 6;
    const c2y = y2 + (y1 - y(p3.count)) / 6;
    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
  }
  return path;
}

const linePath = smoothPath(points);
const areaPath = `${linePath} L ${x(points.length - 1)} ${top + plotHeight} L ${x(0)} ${top + plotHeight} Z`;

const tickCount = 5;
const grid = [];
for (let i = 0; i <= tickCount; i++) {
  const value = Math.round((yMax * (tickCount - i)) / tickCount);
  const yy = y(value);
  grid.push(`<line x1="${left}" y1="${yy}" x2="${width - right}" y2="${yy}" stroke="#30363d" stroke-width="1" opacity="0.55"/>`);
  grid.push(`<text x="${left - 14}" y="${yy + 4}" text-anchor="end" fill="#c9b8c8" font-size="12" font-family="Segoe UI,Arial,sans-serif">${value}</text>`);
}

// Keep the X-axis readable while every plotted point remains one real day.
const xLabels = [];
const labelDays = [1, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 365];
for (const day of labelDays) {
  const i = Math.min(points.length - 1, Math.max(0, day - 1));
  if (points[i]) {
    xLabels.push(`<text x="${x(i)}" y="${height - 28}" text-anchor="middle" fill="#c9b8c8" font-size="11" font-family="Segoe UI,Arial,sans-serif">${day}</text>`);
  }
}

// Subtle hover targets preserve the exact daily date/count without covering the graph visually.
const hoverTargets = points.map((p, i) => {
  const start = i === 0 ? left : (x(i - 1) + x(i)) / 2;
  const end = i === points.length - 1 ? width - right : (x(i) + x(i + 1)) / 2;
  return `<rect x="${start}" y="${top}" width="${Math.max(1, end - start)}" height="${plotHeight}" fill="transparent"><title>${p.date} — ${p.count} contributions</title></rect>`;
}).join("\n");

const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="pinkArea" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ff5fb2" stop-opacity="0.76"/>
    <stop offset="100%" stop-color="#ff5fb2" stop-opacity="0.14"/>
  </linearGradient>
</defs>
<rect width="${width}" height="${height}" rx="18" fill="#111522"/>
<circle cx="42" cy="28" r="7" fill="#ff5fb2"/>
<text x="60" y="34" fill="#f4dbea" font-size="20" font-weight="700" font-family="Segoe UI,Arial,sans-serif">Daily Contributions</text>
<text x="60" y="55" fill="#a99aaa" font-size="12" font-family="Segoe UI,Arial,sans-serif">Real-time data from GitHub</text>
${grid.join("\n")}
<path d="${areaPath}" fill="url(#pinkArea)"/>
<path d="${linePath}" fill="none" stroke="#ff69b4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
${xLabels.join("\n")}
${hoverTargets}
<text x="${width / 2}" y="${height - 7}" text-anchor="middle" fill="#8f8292" font-size="11" font-family="Segoe UI,Arial,sans-serif">Day</text>
<text x="12" y="${top + plotHeight / 2}" text-anchor="middle" fill="#8f8292" font-size="11" font-family="Segoe UI,Arial,sans-serif" transform="rotate(-90 12 ${top + plotHeight / 2})">Contributions</text>
</svg>`;

fs.writeFileSync("assets/contribution-graph-pink.svg", svg);
