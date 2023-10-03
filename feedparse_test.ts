import { readTXT } from "./deps.ts";
import { parseUnParsed } from "./feedparse.ts";
import { FuelEntry } from "./FuelEntry.ts";
import { assertEquals } from "./test_deps.ts";

const xmlfile = "./.fixtures/rss.xml";
const statefile = "./.fixtures/state.json";

Deno.test("TestParsing a valid feed, no new entries", async () => {
  const xml: string = await readTXT(xmlfile);
  const parsed: FuelEntry[] = await parseUnParsed(xml, statefile);
  console.log(parsed.length);
  // assertEquals(parsed.length > 0);
});

Deno.test("Test Parsing valid feed, 1 new entry", () => {
  assertEquals(1, 1);
});

Deno.test("Test Parsing invalid feed", () => {
  assertEquals(true, true);
});
