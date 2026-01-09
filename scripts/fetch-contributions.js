import fs from "fs";
import https from "https";

const USER = "DebasmitaBose0";

const query = JSON.stringify({
  query: `
    query {
      user(login: "${USER}") {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                contributionCount
              }
            }
          }
        }
      }
    }
  `
});

function fetchData() {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: "api.github.com",
      path: "/graphql",
      method: "POST",
      headers: {
        "User-Agent": "GitHub-Action",
        "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        "Content-Length": query.length
      }
    }, res => {
      let data = "";
      res.on("data", d => data += d);
      res.on("end", () => resolve(JSON.parse(data)));
    });

    req.write(query);
    req.end();
  });
}

(async () => {
  const json = await fetchData();
  const days = json.data.user.contributionsCollection
    .contributionCalendar.weeks
    .flatMap(w => w.contributionDays)
    .slice(-30)
    .map(d => d.contributionCount);

  fs.writeFileSync("data/contributions.json", JSON.stringify(days));
})();
