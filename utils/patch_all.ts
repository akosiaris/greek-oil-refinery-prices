// Patch all data using our json_patches.json

import { JsonPatch, readJSON, writeJSON } from "../deps.ts";

const inputfile = Deno.args[0];
const outfile = Deno.args[1];
const patchfile = Deno.args[2];
const entries = await readJSON(inputfile);
const patches = await readJSON(patchfile);
const jPatch = new JsonPatch();

const newdata = [];
for (const entry of entries) {
  let p = entry;
  for (const patch of patches) {
    try {
      p = jPatch.patch(p, patch);
    } catch (_e) {
      // Test failed, ignore
    }
  }
  newdata.push(p);
}

await writeJSON(outfile, newdata, null, 2);
