import fs from "fs";

const payload = JSON.parse(fs.readFileSync("data/contributions.json", "utf8"));
const contributions = (payload.contributions || [])
  .map(d => ({ date: d.date, count: Number(d.count || 0) }))
  .sort((a, b) => a.date.localeCompare(b.date));

// Plot the latest 365 REAL daily contribution values.
const points = contributions.slice(-365);
const width = 1100;
const height = 380;
const left = 12;
const right = 58;
const top = 48;
const bottom = 58;
const plotWidth = width - left - right;
const plotHeight = height - top - bottom;
const maxValue = Math.max(...points.map(p => p.count), 1);
const yMax = maxValue;
const x = i => points.length > 1 ? left + (i / (points.length - 1)) * plotWidth : left;
const y = value => top + plotHeight - (value / yMax) * plotHeight;

// Smoothly scale the Y-axis from 0 to the user's actual highest daily contribution.
const yTicks = 5;
const grid = [];
for (let i = 0; i <= yTicks; i++) {
  const value = Math.round((yMax / yTicks) * i);
  const yy = y(value);
  grid.push(`<line x1="${left}" y1="${yy}" x2="${width - right}" y2="${yy}" stroke="#30363d" stroke-width="1" opacity="0.75"/>`);
  grid.push(`<text x="${width - right + 10}" y="${yy + 4}" fill="#8b949e" font-size="11" font-family="Segoe UI,Arial,sans-serif">${value}</text>`);
}

const linePoints = points.map((p, i) => `${x(i)},${y(p.count)}`).join(" ");
const areaPoints = `${left},${top + plotHeight} ${linePoints} ${x(points.length - 1)},${top + plotHeight}`;

const dots = points.map((p, i) =>
  `<circle cx="${x(i)}" cy="${y(p.count)}" r="2.2" fill="#ff69b4"><title>${p.date}: ${p.count} contributions</title></circle>`
).join("\n");

// Show month labels while keeping the X-axis based on every single day.
const labels = [];
let previousMonth = "";
points.forEach((p, i) => {
  const month = p.date.slice(0, 7);
  if (month !== previousMonth) {
    labels.push(`<text x="${x(i)}" y="${height - 27}" fill="#8b949e" font-size="10" font-family="Segoe UI,Arial,sans-serif">${month}</text>`);
    previousMonth = month;
  }
});

const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="pinkArea" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ff69b4" stop-opacity="0.78"/>
    <stop offset="100%" stop-color="#ff69b4" stop-opacity="0.12"/>
  </linearGradient>
</defs>
<rect width="${width}" height="${height}" rx="12" fill="#111827"/>
${grid.join("\n")}
<polygon points="${areaPoints}" fill="url(#pinkArea)"/>
<polyline points="${linePoints}" fill="none" stroke="#ff69b4" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
${dots}
${labels.join("\n")}
<text x="${width / 2}" y="22" text-anchor="middle" fill="#ff69b4" font-size="20" font-weight="700" font-family="Segoe UI,Arial,sans-serif">🔥 My Active Contribution Graph 🔥</text>
<text x="${width - 4}" y="${top - 10}" text-anchor="end" fill="#8b949e" font-size="11" font-family="Segoe UI,Arial,sans-serif">Daily Contributions</text>
<text x="${width / 2}" y="${height - 8}" text-anchor="middle" fill="#8b949e" font-size="11" font-family="Segoe UI,Arial,sans-serif">Date (each point = one day)</text>
</svg>`;

fs.writeFileSync("assets/contribution-graph-pink.svg", svg);
