import fs from "fs";

const payload = JSON.parse(fs.readFileSync("data/contributions.json", "utf8"));
const contributions = (payload.contributions || [])
  .map(d => ({ date: d.date, count: Number(d.count || 0) }))
  .sort((a, b) => a.date.localeCompare(b.date));

// Real daily GitHub contribution values. Keep one point per day.
const points = contributions.slice(-365);
const width = 1100;
const height = 360;
const left = 12;
const right = 58;
const top = 18;
const bottom = 48;
const plotWidth = width - left - right;
const plotHeight = height - top - bottom;
const maxValue = Math.max(...points.map(p => p.count), 0);
const yMax = Math.max(1, maxValue);
const x = i => points.length > 1 ? left + (i / (points.length - 1)) * plotWidth : left;
const y = value => top + plotHeight - (value / yMax) * plotHeight;

// Clean Y-axis: 0 through the user's real highest daily contribution.
const tickCount = 5;
const ticks = [];
for (let i = 0; i <= tickCount; i++) {
  const value = Math.round((yMax * i) / tickCount);
  const yy = y(value);
  ticks.push(`
    <line x1="${left}" y1="${yy}" x2="${width - right}" y2="${yy}" stroke="#30363d" stroke-width="1" opacity="0.45"/>
    <text x="${width - right + 10}" y="${yy + 4}" fill="#8b949e" font-size="11" font-family="Segoe UI,Arial,sans-serif">${value}</text>
  `);
}

const linePoints = points.map((p, i) => `${x(i)},${y(p.count)}`).join(" ");
const areaPoints = `${left},${top + plotHeight} ${linePoints} ${x(points.length - 1)},${top + plotHeight}`;

// Month labels only; the plotted X-axis remains one point per day.
const labels = [];
let previousMonth = "";
for (let i = 0; i < points.length; i++) {
  const month = points[i].date.slice(0, 7);
  if (month !== previousMonth) {
    labels.push(`<text x="${x(i)}" y="${height - 14}" fill="#8b949e" font-size="11" font-family="Segoe UI,Arial,sans-serif">${month}</text>`);
    previousMonth = month;
  }
}

// Invisible hit targets give each day an exact hover tooltip without cluttering the line.
const hitTargets = points.map((p, i) => {
  const nextX = i < points.length - 1 ? x(i + 1) : x(i);
  const prevX = i > 0 ? x(i - 1) : x(i);
  const hitX = i === 0 ? left : (prevX + x(i)) / 2;
  const hitWidth = i === 0 ? Math.max(4, (nextX - x(i)) / 2) : Math.max(4, nextX - hitX);
  return `<rect x="${hitX}" y="${top}" width="${hitWidth}" height="${plotHeight}" fill="transparent"><title>${p.date}: ${p.count} contributions</title></rect>`;
}).join("\n");

const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="pinkArea" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ff69b4" stop-opacity="0.78"/>
    <stop offset="100%" stop-color="#ff69b4" stop-opacity="0.16"/>
  </linearGradient>
</defs>
<rect width="${width}" height="${height}" rx="8" fill="#111827"/>
${ticks.join("\n")}
<polygon points="${areaPoints}" fill="url(#pinkArea)"/>
<polyline points="${linePoints}" fill="none" stroke="#ff69b4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
${labels.join("\n")}
${hitTargets}
</svg>`;

fs.writeFileSync("assets/contribution-graph-pink.svg", svg);
