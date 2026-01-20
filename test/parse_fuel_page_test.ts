import { readTXT } from "../deps.ts";
import { parseFuelPage } from "../src/parse_fuel_page.ts";

import { assertEquals } from "../test_deps.ts";

const sample_page_file = "./.fixtures/sample_page_2019_to_20251105.html";

Deno.test("Parse a fuel page stanza for format 2019 to 2025-11-05", async () => {
  const page: string = await readTXT(sample_page_file);
  console.log(page);
  const fuels = parseFuelPage(page);
  assertEquals(fuels.length, 18);
});
