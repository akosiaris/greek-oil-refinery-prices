import { FuelEntry } from './FuelEntry.ts';
import {
    parseFeed,
    readJSON,
    writeJSON } from './deps.ts';
import { parseFuelPage } from './postprocess.ts';

export async function parseUnParsed(xml: string, statefile: string): Promise<FuelEntry[]> {
  try {
    let ret: FuelEntry[] = [];
    const statedata  = await readJSON(statefile);
    const {entries} = await parseFeed(xml);
    for (const entry of entries) {
      if (!(entry.id in statedata)) {
        const freshdata: FuelEntry[] = parseFuelPage(entry.content.value);
        ret = ret.concat(freshdata);
        statedata[entry.id] = true;
      }
    }
    await writeJSON(statefile, statedata, null, 2);
    return ret.reverse();
  } catch(error) {
    console.log(error);
    return [];
  }
}