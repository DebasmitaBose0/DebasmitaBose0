import fs from "fs";

const payload = JSON.parse(fs.readFileSync("data/contributions.json", "utf8"));
const weeks = payload.weeks || [];
const total = payload.totalContributions || 0;

const levelColors = {
  NONE: "#161b22",
  FIRST_QUARTILE: "#0e4429",
  SECOND_QUARTILE: "#006d32",
  THIRD_QUARTILE: "#26a641",
  FOURTH_QUARTILE: "#39d353"
};

const width = 1000;
const height = 260;
const left = 55;
const top = 55;
const cell = 12;
const gap = 4;
const weekStep = cell + gap;

const rects = [];
weeks.forEach((week, wi) => {
  week.contributionDays.forEach((day) => {
    const date = new Date(`${day.date}T00:00:00Z`);
    const dow = date.getUTCDay();
    const x = left + wi * weekStep;
    const y = top + dow * weekStep;
    const color = levelColors[day.contributionLevel] || levelColors.NONE;
    rects.push(`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" fill="${color}"><title>${day.date}: ${day.contributionCount} contribution${day.contributionCount === 1 ? "" : "s"}</title></rect>`);
  });
});

const monthLabels = [];
let lastMonth = "";
weeks.forEach((week, wi) => {
  const first = week.contributionDays[0];
  if (!first) return;
  const date = new Date(`${first.date}T00:00:00Z`);
  const month = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  if (month !== lastMonth && wi > 0) {
    monthLabels.push(`<text x="${left + wi * weekStep}" y="42" fill="#8b949e" font-size="11" font-family="Segoe UI, Arial, sans-serif">${month}</text>`);
    lastMonth = month;
  }
});

const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
<rect width="${width}" height="${height}" rx="18" fill="#0d1117"/>
<text x="500" y="25" text-anchor="middle" fill="#ff69b4" font-size="20" font-weight="700" font-family="Segoe UI, Arial, sans-serif">🔥 My Active Contribution Graph 🔥</text>
<text x="500" y="225" text-anchor="middle" fill="#8b949e" font-size="12" font-family="Segoe UI, Arial, sans-serif">${total} contributions • Live GitHub contribution data</text>
${monthLabels.join("\n")}
${rects.join("\n")}
<text x="${left - 5}" y="${top + 2 * weekStep + 3}" text-anchor="end" fill="#8b949e" font-size="10" font-family="Segoe UI, Arial, sans-serif">Wed</text>
<text x="${left - 5}" y="${top + 4 * weekStep + 3}" text-anchor="end" fill="#8b949e" font-size="10" font-family="Segoe UI, Arial, sans-serif">Fri</text>
</svg>`;

fs.writeFileSync("assets/contribution-graph-pink.svg", svg);
