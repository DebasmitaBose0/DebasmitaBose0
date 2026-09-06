import fs from "fs";
import https from "https";

const USER = "DebasmitaBose0";
const URL = `https://github-contributions-api.jogruber.de/v4/${USER}?y=all`;

function fetchData() {
  return new Promise((resolve, reject) => {
    https.get(URL, { headers: { "User-Agent": "DebasmitaBose0-GitHub-Profile" } }, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          if (res.statusCode !== 200) reject(new Error(`Contribution API returned ${res.statusCode}`));
          else resolve(JSON.parse(data));
        } catch (error) { reject(error); }
      });
    }).on("error", reject);
  });
}

const json = await fetchData();
if (!Array.isArray(json.contributions)) throw new Error("Invalid contribution API response");

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/contributions.json", JSON.stringify(json));
