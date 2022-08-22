import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';
import { readTXT, readJSON, writeJSON } from 'https://deno.land/x/flat/mod.ts';
import { parseFeed } from 'https://deno.land/x/rss/mod.ts';
import parse from 'https://deno.land/x/date_fns/parse/index.js';
import { el, enUS } from "https://deno.land/x/date_fns/locale/index.js";

const plainDatafile:string = 'data_plain.json';
const augmentedDatafile:string = 'data_augmented.json';
const fullDatafile:string = 'data_full.json';
const statefile:string = 'state.json';
const daysRegExp:RegExp = /(Δευτέρα|Τρίτη|Τετάρτη|Πέμπτη|Παρασκευή|Σάββατο|Κυριακή)/;
const fuelCategoriesRegExp:RegExp = /(Βενζίνες|Πετρέλαια|Υγραέρια – LPG|ΜΑΖΟΥΤ-FUEL OIL|ΚΗΡΟΖΙΝΗ – KERO|ΑΣΦΑΛΤΟΣ) \((.+)\)/;
const ignoreRegExp:RegExp = /ΕΛ.ΠΕ.|Motor Oil|EX-FACTORY|ΧΠ: Χειμερινή Περίοδος/;

function parseOilPage(html:string): [object] {
  try {
    const document:any = new DOMParser().parseFromString(html, 'text/html');
    const tbody:any = document.querySelector('tbody');

    let candidateDates:string = null;
    let sanitizedDates:string = null;
    let parsedDates:[Date] = null;
    let category:string = null;
    let notes:string = null;
    let data:[object] = new Array();

    let i:number;
    for (i=0; i < tbody.children.length; i++) {
      if (daysRegExp.test(tbody.children[i].textContent)) {
        candidateDates = tbody.children[i].textContent.trim();
        sanitizedDates = sanitizeDates(candidateDates);
        parsedDates = parseDates(sanitizedDates);
      } else if (fuelCategoriesRegExp.test(tbody.children[i].textContent)) {
        let match = tbody.children[i].textContent.match(fuelCategoriesRegExp)
        category = match[1];
        notes = match[2];
      } else if (ignoreRegExp.test(tbody.children[i].textContent)) {
        // do nothing, we don't care
      } else {
       // Here we go, we are parsing actual prices now
        let tds = tbody.children[i].children;
        let fuelName:string = tds[0].textContent.trim();
        let elpePrice:number = parseFloat(tds[1].textContent.replace(/\./, '').replace(/,/, '.'));
        let motoroilPrice:number = parseFloat(tds[2].textContent.replace(/\./, '').replace(/,/, '.'));
        // And let's create the object
        let datum = {
          orig_date: date,
          parsedDate: parsedDates[0],
          category: category,
          notes: notes,
          fuelName: fuelName,
          elpePrice: elpePrice,
          motoroilPrice: motoroilPrice,
        };
        data.push(datum);
      }
    }
    return data;
  } catch(error) {
    console.log(error);
  }
}

function sanitizeDates(input:string): string {
  let dates:string = null;
  // Remove great from days
  dates = input.replace('Μεγάλο', '').replace('Μεγάλη', '').replace('Μεγ.', '');
  // Normalize string, e.g. get rid of unicode no break spaces
  dates = dates.normalize('NFKC');
  // Remove all spaces now, the original data can be inconsistent anyway
  dates = dates.replaceAll(' ', '');
  // Lowercase too as the original data can be inconsistent anyway
  dates = dates.toLowerCase();
  // Selectively fix a mess with diacritics and accents, hopefully it won't become larger than this
  dates = dates.replace('μαϊου', 'μαΐου').replace('μάϊου', 'μαΐου').replace('ιουνιου', 'ιουνίου');
  return dates;
}

function parseDates(candidateDates:string): [Date] {
  const dateString:string = 'EEEE,dMMMMyyyy';
  let dates:[Date] = new Array();
  let hack:[string] = [candidateDates];
  for (let date of hack) {
    parsedDate = parse(date, dateString, new Date(), {locale: el});
    dates.push(parsedDate);
  }
  return dates;
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
    return ret.reverse();
  } catch(error) {
    console.log(error);
  }
}

function stripNulls(data:[object]): [object] {
  let ret:[object] = new Array();
  try {
    for (let datum of data) {
      if (!datum.elpePrice) {
        delete datum.elpePrice;
      }
      if (!datum.motoroilPrice) {
        delete datum.motoroilPrice;
      }
      if (!datum.meanPrice) {
        delete datum.meanPrice;
      }
    ret.push(datum);
    }
    return ret;
  } catch(error) {
    console.log(error);
  }
}

function addMeanValue(data:[object]): [object] {
  let ret:[object] = new Array();
  try {
    for (let datum of data) {
      if (datum.elpePrice && datum.motoroilPrice) {
        datum.meanPrice = (datum.elpePrice + datum.motoroilPrice) / 2;
      } else if (datum.elpePrice) {
        datum.meanPrice = datum.elpePrice;
      } else if (datum.motoroilPrice) {
        datum.meanPrice = datum.motoroilPrice;
      } else {
        datum.meanPrice = NaN;
      }
      ret.push(datum);
    }
    return ret;
  } catch(error) {
    console.log(error);
  }
}

function addVAT(data:[object]): [object] {
  let ret:[object] = new Array();
  try {
    for (let datum of data) {
      datum.vat24Price_per_lt = datum.meanPrice * 1.24 / 1000;
      datum.vat17Price_per_lt = datum.meanPrice * 1.17 / 1000;
      datum.vat17notes = 'Only for Λέρο, Λέσβο, Κω, Σάμο και Χίο';
      ret.push(datum);
    }
    return ret;
  } catch(error) {
    console.log(error);
  }
}

async function appendData(data:[object], datafile:string): void {
  let jsondata;
  try {
    jsondata  = await readJSON(datafile);
    jsondata = jsondata.concat(data);
  } catch(error) {
    jsondata = data;
  }
  try {
    await writeJSON(datafile, jsondata, null, 2);
  } catch(error) {
    console.log(error);
  }
}

try {
  const xmlfile:string = Deno.args[0]
  const xml:string = await readTXT(xmlfile);
  let parsed:[object] = await parseUnParsed(xml);
  // Write the original data
  await appendData(parsed, fullDatafile);
  // Add mean price
  let augmented:[object] = addMeanValue(parsed);
  augmented = addVAT(augmented);
  await appendData(augmented, augmentedDatafile);
  // Remove nulls,NaNs
  let plain:[object] = stripNulls(augmented);
  await appendData(plain, plainDatafile);
} catch(error) {
  console.log(error);
}
