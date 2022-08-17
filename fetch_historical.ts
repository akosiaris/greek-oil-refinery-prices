import { writeTXT } from 'https://deno.land/x/flat/mod.ts';
const site = 'http://oil.gge.gov.gr/?p=';
for (var i:number=11508; i<=15154; i++) {
	let resp = await fetch(site + i);
	let txt = await resp.text();
	await writeTXT('data_' + i, txt );
}
