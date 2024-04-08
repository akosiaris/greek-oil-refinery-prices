import { FuelEntry } from "./src/FuelEntry.ts";

import { writeDataFiles } from "./src/datastorage.ts";
import { readTXT } from "./deps.ts";
import { parseUnParsed } from "./src/feedparse.ts";

const statefile = "state.json";

async function main(): Promise<void> {
  try {
    const xmlfile: string = Deno.args[0];

    if (xmlfile) {
      const xml: string = await readTXT(xmlfile);
      const parsed: FuelEntry[] = await parseUnParsed(xml, statefile);
      await writeDataFiles(parsed);
    }
  } catch (error) {
    console.log(error);
  }
}

if (import.meta.main) {
  await main();
}
