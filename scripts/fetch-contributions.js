import fs from "fs";
import https from "https";

const USER = "DebasmitaBose0";
const query = JSON.stringify({
  query: `query { user(login: "${USER}") { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }`
});

function fetchData() {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.github.com",
      path: "/graphql",
      method: "POST",
      headers: {
        "User-Agent": "DebasmitaBose0-GitHub-Profile",
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(query)
      }
    }, res => {
      let data = "";
      res.on("data", d => data += d);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.errors) reject(new Error(JSON.stringify(json.errors)));
          else resolve(json);
        } catch (error) { reject(error); }
      });
    });
    req.on("error", reject);
    req.write(query);
    req.end();
  });
}

const json = await fetchData();
const calendar = json.data.user.contributionsCollection.contributionCalendar;
fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/contributions.json", JSON.stringify({
  totalContributions: calendar.totalContributions,
  weeks: calendar.weeks
}));
