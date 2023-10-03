import { env } from "node:process";
import { FuelEntry } from "./FuelEntry.ts";

import { writeDataFiles } from "./datastorage.ts";
import { readTXT } from "./deps.ts";
import { parseUnParsed } from "./feedparse.ts";

const statefile = "state.json";

async function main(): Promise<void> {
  try {
    const xmlfile: string = Deno.args[0];
    const elasticsearch_url = env["ELASTICSEARCH_URL"];
    const elasticsearch_username = env["ELASTICSEARCH_USERNAME"];
    const elasticsearch_password = env["ELASTICSEARCH_PASSWORD"];
    const b64 = btoa(elasticsearch_username + ":" + elasticsearch_password);

    if (xmlfile) {
      const xml: string = await readTXT(xmlfile);
      const parsed: FuelEntry[] = await parseUnParsed(xml, statefile);
      await writeDataFiles(parsed);
      if (elasticsearch_url) {
        /* Now, let's post them to elasticsearch */
        for (const entry of parsed) {
          const response = await fetch(elasticsearch_url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Basic " + b64,
            },
            body: JSON.stringify(entry),
          });
          if (response.status != 201) {
            // POST failed, log why
            console.log(response);
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}

if (import.meta.main) {
  await main();
}
