import fs from "fs";
import https from "https";

const USER = "DebasmitaBose0";
const YEAR = new Date().getUTCFullYear();
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) throw new Error("GITHUB_TOKEN is required");

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.github.com",
      path,
      method: options.method || "GET",
      headers: {
        "User-Agent": "DebasmitaBose0-GitHub-Stats",
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github+json",
        ...(options.body ? { "Content-Type": "application/json" } : {})
      }
    }, res => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        if (res.statusCode >= 400) return reject(new Error(`${res.statusCode}: ${body}`));
        try { resolve(JSON.parse(body)); } catch { resolve(body); }
      });
    });
    req.on("error", reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function graphql(query, variables = {}) {
  return request("/graphql", { method: "POST", body: { query, variables } });
}

// Do NOT use /user/repos here: that endpoint refers to the Actions bot.
async function getAllOwnedRepos() {
  const repos = [];
  for (let page = 1; ; page++) {
    const batch = await request(`/users/${USER}/repos?per_page=100&page=${page}&type=owner&sort=updated`);
    repos.push(...batch.filter(r => !r.fork));
    if (batch.length < 100) break;
  }
  return repos;
}

const from = `${YEAR}-01-01T00:00:00Z`;
const to = `${YEAR + 1}-01-01T00:00:00Z`;
const query = `
query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    name
    followers { totalCount }
    repositories(ownerAffiliations: OWNER, first: 1) { totalCount }
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalRepositoriesWithContributedCommits
    }
  }
}`;

const result = await graphql(query, { login: USER, from, to });
if (result.errors) throw new Error(JSON.stringify(result.errors));
if (!result.data?.user) throw new Error("GitHub user not found");

const user = result.data.user;
const c = user.contributionsCollection;
const repos = await getAllOwnedRepos();
const stars = repos.reduce((sum, repo) => sum + Number(repo.stargazers_count || 0), 0);
const repositories = user.repositories.totalCount;
const followers = user.followers.totalCount;
const commits = c.totalCommitContributions;
const prs = c.totalPullRequestContributions;
const issues = c.totalIssueContributions;
const contributedTo = c.totalRepositoriesWithContributedCommits;

const score = Math.min(100, Math.round(
  Math.min(commits / 300, 1) * 40 +
  Math.min(prs / 20, 1) * 25 +
  Math.min(issues / 20, 1) * 10 +
  Math.min(stars / 25, 1) * 15 +
  Math.min(contributedTo / 10, 1) * 10
));
const grade = score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B+" : score >= 60 ? "B" : score >= 50 ? "C+" : "C";
const circumference = 2 * Math.PI * 42;
const ringOffset = Math.round(circumference * (1 - score / 100));
const esc = v => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const svg = `<svg width="760" height="330" viewBox="0 0 760 330" xmlns="http://www.w3.org/2000/svg">
<style>.bg{fill:#0d1117}.title{fill:#ff69b4;font-size:24px;font-weight:700;font-family:'Segoe UI',sans-serif}.label{fill:#ffc0cb;font-size:17px;font-family:'Segoe UI',sans-serif}.value{fill:#fff;font-weight:700}.muted{fill:#8b949e;font-size:11px;font-family:'Segoe UI',sans-serif}.ring-bg{stroke:#2a2a2a;stroke-width:11;fill:none}.ring{stroke:#ff69b4;stroke-width:11;fill:none;stroke-linecap:round}</style>
<rect class="bg" width="760" height="330" rx="18"/>
<text x="380" y="42" text-anchor="middle" class="title">🏆 GitHub Profile Stats 🏆</text>
<text x="380" y="68" text-anchor="middle" class="muted">${esc(user.name || USER)} • Live GitHub API data • ${YEAR}</text>
<text x="45" y="112" class="label">📦 Repositories: <tspan class="value">${repositories}</tspan></text>
<text x="45" y="150" class="label">⭐ Stars: <tspan class="value">${stars}</tspan></text>
<text x="45" y="188" class="label">👥 Followers: <tspan class="value">${followers}</tspan></text>
<text x="45" y="226" class="label">💻 Commits (${YEAR}): <tspan class="value">${commits}</tspan></text>
<text x="45" y="264" class="label">🔀 PRs (${YEAR}): <tspan class="value">${prs}</tspan></text>
<text x="45" y="302" class="label">🐞 Issues (${YEAR}): <tspan class="value">${issues}</tspan></text>
<circle cx="610" cy="174" r="42" class="ring-bg"/>
<circle cx="610" cy="174" r="42" class="ring" stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${ringOffset}" transform="rotate(-90 610 174)"/>
<text x="610" y="181" text-anchor="middle" font-size="22" fill="#fff" font-weight="700" font-family="Segoe UI,sans-serif">${grade}</text>
<text x="610" y="235" text-anchor="middle" class="muted">LIVE SCORE ${score}/100</text>
<text x="610" y="255" text-anchor="middle" class="muted">Contributed to ${contributedTo} repos</text>
</svg>`;

fs.mkdirSync("assets", { recursive: true });
fs.writeFileSync("assets/github-stats.svg", svg);
console.log({ YEAR, repositories, stars, followers, commits, prs, issues, contributedTo, score, grade });
