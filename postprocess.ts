
import { FuelEntry } from "./src/FuelEntry.ts";

import { writeDataFiles } from "./src/datastorage.ts";
import { readTXT } from "./deps.ts";
import { parseUnParsed } from "./src/feedparse.ts";

const statefile = "state.json";

/**
 * Processes the XML file and writes the parsed data to data files.
 * @returns A Promise that resolves when the processing is complete.
 */
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
