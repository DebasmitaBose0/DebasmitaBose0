import fs from "fs";

const data = JSON.parse(fs.readFileSync("data/contributions.json"));

const points = data.map((v, i) => {
  const x = 80 + i * 35;
  const y = 300 - v * 2;   // scale
  return `${x},${y}`;
}).join(" ");

const svg = `
<svg width="1200" height="360" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="360" fill="#000"/>
  <text x="600" y="35" fill="#ff69b4" font-size="22" text-anchor="middle">
    💖 Debasmita Bose's Contribution Graph
  </text>
  <polyline points="${points}" fill="none" stroke="#ff69b4" stroke-width="4"/>
</svg>
`;

fs.writeFileSync("assets/contribution-graph-pink-clean.svg", svg);
