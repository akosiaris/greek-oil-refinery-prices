
import { FuelEntry } from "./src/FuelEntry.ts";

import { writeDataFiles } from "./src/datastorage.ts";
import { readTXT } from "./deps.ts";
import { parseUnParsed } from "./src/feedparse.ts";

const statefile = "state.json";

/**
 * Processes the flat downloaded file and writes the parsed data to data files.
 * @returns A Promise that resolves when the processing is complete.
 */
async function main(): Promise<void> {
  try {
    const inputfile: string = Deno.args[0];

    if (inputfile) {
      const input: string = await readTXT(inputfile);
      const parsed: FuelEntry[] = await parseUnParsed(input, statefile);
      await writeDataFiles(parsed);
    }
  } catch (error) {
    console.log(error);
  }
}

if (import.meta.main) {
  await main();
}
