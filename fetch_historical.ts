import { writeTXT, readTXT } from 'https://deno.land/x/flat/mod.ts';
import { parseOilPage, writeDataFiles } from './postprocess.ts';

const site: string = 'http://oil.gge.gov.gr/?p=';
let start: number=11505;
let end: number=15154;

for (var i: number=start; i<=end; i++) {
  let txt: string = '';
  try {
    txt = await readTXT('old_data/html_' + i);
  } catch(error) {
    let resp = await fetch(site + i);
    if (!(resp.status == 200)) {
      continue;
    }
    txt = await resp.text();
    await writeTXT('old_data/html_' + i, txt);
  }
  let pagedata: object[] = parseOilPage(txt);
  if (!pagedata) {
    console.log('Not parsed' + txt);
  } else if (pagedata.length > 0) {
    await writeDataFiles(pagedata);
    continue
  } else {
    console.log('Empty page, not parsed? html_' + i);
  }
}