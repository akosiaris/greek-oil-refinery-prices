import {
    parseFuelPage
} from './parse_fuel_page.ts';
import { readTXT } from "./deps.ts";

import { assertEquals } from './test_deps.ts';

const sample_page_file = './.fixtures/sample_page.html';

Deno.test('Parse a fuel page stanza', async () => {
    const page: string = await readTXT(sample_page_file);
    console.log(page);
    const fuels = parseFuelPage(page);
    assertEquals(fuels.length, 18);
});