import parse from 'https://deno.land/x/date_fns/parse/index.js';
import { el, enUS } from "https://deno.land/x/date_fns/locale/index.js";
import { writeTXT } from 'https://deno.land/x/flat/mod.ts';
import { parseOilPage } from './postprocess.ts';

const site = 'http://oil.gge.gov.gr/?p=';
const start:number=11505;
let end:number=15154;
end = 11513;
for (var i:number=start; i<=end; i++) {
  let resp = await fetch(site + i);
  if (!(resp.status == 200)) {
    continue;
  }
  let txt = await resp.text();
  let pagedata:object = parseOilPage(txt);
  console.log(pagedata);
  await writeTXT('html_' + i, txt );
}
