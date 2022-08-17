import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';
import { readTXT, readJSON, writeJSON } from 'https://deno.land/x/flat/mod.ts';
import { parseFeed } from "https://deno.land/x/rss/mod.ts";

const datafile:string = 'data.json';
const statefile:string = 'state.json';
const daysRegExp:RegExp = /(Δευτέρα|Τρίτη|Τετάρτη|Πέμπτη|Παρασκευή|Σάββατο|Κυριακή)/;
const fuelCategoriesRegExp:RegExp = /(Βενζίνες|Πετρέλαια|Υγραέρια|ΜΑΖΟΥΤ-FUEL OIL|ΚΗΡΟΖΙΝΗ|ΑΣΦΑΛΤΟΣ)/;
const ignoreRegExp:RegExp = /ΕΛ.ΠΕ.|Motor Oil|EX-FACTORY/;

function parseOilPage(html: string): [object] {
  try {
    const document:any = new DOMParser().parseFromString(html, 'text/html');
    const tbody:any = document.querySelector('tbody');

    var date:string = null;
    var category:string = null;
    var data:[object] = new Array();
   
    var i:number;
    for (i=0; i < tbody.children.length; i++) {
      if (daysRegExp.test(tbody.children[i].textContent)) {
        date = tbody.children[i].textContent;
      } else if (fuelCategoriesRegExp.test(tbody.children[i].textContent)) {
        category = tbody.children[i].textContent.match(fuelCategoriesRegExp)[0];
      } else if (ignoreRegExp.test(tbody.children[i].textContent)) {
        // do nothing, we don't care
      } else {
       // Here we go, we are parsing actual prices now
        var tds = tbody.children[i].children;
        var fuelName:string = tds[0].textContent;
        var elpePrice:number = parseFloat(tds[1].textContent.replace(/\./, '').replace(/,/, '.'));
        var motoroilPrice:number = parseFloat(tds[2].textContent.replace(/\./, '').replace(/,/, '.'));
        // And let's create the object
        var datum = {
          date: date.trim(),
          category: category.trim(),
          fuelName: fuelName.trim(),
        };
        if (elpePrice) { datum.elpePrice = elpePrice };
        if (motoroilPrice) { datum.motoroilPrice = motoroilPrice };
        data.push(datum);
      }
    }
    return data;
  } catch(error) {
    console.log(error);
  }
}

async function appendData(data: [object]): void {
  try {
    let jsondata  = await readJSON(datafile);
    jsondata = jsondata.concat(data);
    await writeJSON(datafile, jsondata, null, 2);
  } catch(error) {
    console.log(error);
  }
}

async function parseUnParsed(xml:string): [object] {
  try {
    let ret:[object] = new Array();
    var statedata  = await readJSON(statefile);
    const {entries} = await parseFeed(xml);
    for (let entry of entries) {
      if (!(entry.id in statedata)) {
        let freshdata = parseOilPage(entry.content.value);
        ret = ret.concat(freshdata);
        statedata[entry.id] = true;
      }
    };
    await writeJSON(statefile, statedata, null, 2);
    return ret;
  } catch(error) {
    console.log(error);
  }
}

try {
  const xmlfile:string = Deno.args[0]
  const xml:string = await readTXT(xmlfile);
  var unparsed:[object] = await parseUnParsed(xml);
  await appendData(unparsed);

} catch(error) {
  console.log(error);
}
