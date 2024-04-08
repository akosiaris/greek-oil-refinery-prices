import { writeDataFiles } from "../src/datastorage.ts";
import { readTXT, writeTXT } from "../deps.ts";
import { parseFuelPage } from "../src/parse_fuel_page.ts";

const site = "http://oil.gge.gov.gr/?p=";
// Some sane defaults
let start = 11505;
let end = 15154;

start = parseInt(Deno.args[0]);
end = parseInt(Deno.args[1]);

for (let i: number = start; i <= end; i++) {
  let txt = "";
  try {
    console.log("Reading locally: " + i);
    txt = await readTXT("dist/html_" + i);
  } catch (_error) {
    console.log("Not present locally, fetching: " + i);
    const resp = await fetch(site + i, {
      headers: {
        "User-Agent":
          "One time scraper for https://github.com/akosiaris/greek-oil-refinery-prices. If too aggressive, please open an issue.",
      },
    });
    // Let's be polite
    await new Promise((f) => setTimeout(f, 1000));
    if (!(resp.status == 200)) {
      continue;
    }
    txt = await resp.text();
    await writeTXT("dist/html_" + i, txt);
  }
  const pagedata = parseFuelPage(txt);
  if (!pagedata) {
    console.log("Not parsed" + txt);
  } else if (pagedata.length > 0) {
    await writeDataFiles(pagedata);
    continue;
  } else {
    console.log("Empty page, not parsed? html_" + i);
  }
}
