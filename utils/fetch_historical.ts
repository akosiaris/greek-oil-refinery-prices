import { writeTXT, readTXT } from '../deps.ts';
import { parseFuelPage, writeDataFiles } from '../postprocess.ts';

const site = 'http://oil.gge.gov.gr/?p=';
// Some sane defaults
let start = 11505;
let end = 15154;

start = parseInt(Deno.args[0]);
end = parseInt(Deno.args[1]);

for (let i: number=start; i<=end; i++) {
  let txt = '';
  try {
    txt = await readTXT('dist/html_' + i);
  } catch(_error) {
    const resp = await fetch(site + i);
    if (!(resp.status == 200)) {
      continue;
    }
    txt = await resp.text();
    await writeTXT('dist/html_' + i, txt);
  }
  const pagedata = parseFuelPage(txt);
  if (!pagedata) {
    console.log('Not parsed' + txt);
  } else if (pagedata.length > 0) {
    await writeDataFiles(pagedata);
    continue
  } else {
    console.log('Empty page, not parsed? html_' + i);
  }
}