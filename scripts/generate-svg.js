import fs from "fs";

const payload = JSON.parse(fs.readFileSync("data/contributions.json", "utf8"));
const contributions = payload.contributions || [];

// Group the real daily contribution data into quarterly totals.
const quarters = new Map();
for (const day of contributions) {
  const date = new Date(`${day.date}T00:00:00Z`);
  const year = date.getUTCFullYear();
  const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
  const key = `${year}-Q${quarter}`;
  quarters.set(key, (quarters.get(key) || 0) + (day.count || 0));
}

const points = [...quarters.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .slice(-20)
  .map(([label, value]) => ({ label, value }));

const width = 1000;
const height = 360;
const left = 65;
const right = 35;
const top = 35;
const bottom = 65;
const plotWidth = width - left - right;
const plotHeight = height - top - bottom;
const maxValue = Math.max(...points.map(p => p.value), 1);
const yMax = Math.ceil(maxValue / 10) * 10 || 10;
const xStep = points.length > 1 ? plotWidth / (points.length - 1) : plotWidth;
const y = value => top + plotHeight - (value / yMax) * plotHeight;
const x = index => left + index * xStep;

const grid = [];
for (let i = 0; i <= 5; i++) {
  const value = (yMax / 5) * i;
  const yy = y(value);
  grid.push(`<line x1="${left}" y1="${yy}" x2="${width - right}" y2="${yy}" stroke="#30363d" stroke-width="1"/>`);
  grid.push(`<text x="${width - right + 8}" y="${yy + 4}" fill="#8b949e" font-size="11" font-family="Segoe UI, Arial, sans-serif">${Math.round(value)}</text>`);
}

const linePoints = points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ");
const areaPoints = `${left},${top + plotHeight} ${linePoints} ${x(points.length - 1)},${top + plotHeight}`;

const dots = points.map((p, i) =>
  `<circle cx="${x(i)}" cy="${y(p.value)}" r="3" fill="#58a6ff"><title>${p.label}: ${p.value} contributions</title></circle>`
).join("\n");

const labels = points.map((p, i) => {
  if (points.length > 12 && i % 2 !== 0) return "";
  return `<text x="${x(i)}" y="${height - 30}" text-anchor="middle" fill="#8b949e" font-size="10" font-family="Segoe UI, Arial, sans-serif">${p.label}</text>`;
}).join("\n");

const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
<rect width="${width}" height="${height}" rx="14" fill="#0d1117"/>
<text x="${width / 2}" y="25" text-anchor="middle" fill="#ff69b4" font-size="20" font-weight="700" font-family="Segoe UI, Arial, sans-serif">🔥 My Active Contribution Graph 🔥</text>
${grid.join("\n")}
<text x="${width - 5}" y="${top - 8}" text-anchor="end" fill="#8b949e" font-size="11" font-family="Segoe UI, Arial, sans-serif">Contributions</text>
<polygon points="${areaPoints}" fill="#58a6ff" opacity="0.12"/>
<polyline points="${linePoints}" fill="none" stroke="#58a6ff" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
${dots}
${labels}
<text x="${width / 2}" y="${height - 8}" text-anchor="middle" fill="#8b949e" font-size="11" font-family="Segoe UI, Arial, sans-serif">Quarter</text>
</svg>`;

fs.writeFileSync("assets/contribution-graph-pink.svg", svg);
