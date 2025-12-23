import { readJSON, writeJSON } from "../deps.ts";
import { FuelEntry } from "./FuelEntry.ts";
import { parseFuelPage } from "./parse_fuel_page.ts";

/**
 * Parses the XML feed, ignoring already parsed entries and
 * returns an array of FuelEntry objects.
 *
 * @param xml - The XML feed to parse.
 * @param statefile - The path to the state file.
 * @returns A promise that resolves to an array of FuelEntry objects.
 */
export async function parseUnParsed(
  input: string,
  statefile: string,
): Promise<FuelEntry[]> {
  try {
    let ret: FuelEntry[] = [];
    const statedata = await readJSON(statefile);
    const { posts, postDetails } = await JSON.parse(input);
    for (const post of posts) {
      if (!(post.id in statedata)) {
        const data: any = {
          posts: [post],
          postDetails: postDetails.filter(
            (detail: any) => detail.iD_Post === post.id,
          ),
        };
        const freshdata: FuelEntry[] = parseFuelPage(data);
        ret = ret.concat(freshdata);
        statedata[post.id] = true;
      }
    }
    await writeJSON(statefile, statedata, null, 2);
    return ret.reverse();
  } catch (error) {
    console.log(error);
    return [];
  }
}
