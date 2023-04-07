import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';
import { readTXT, readJSON, writeJSON } from 'https://deno.land/x/flat/mod.ts';
import { parseFeed } from 'https://deno.land/x/rss/mod.ts';
import parse from 'https://deno.land/x/date_fns/parse/index.js';
import isValid from 'https://deno.land/x/date_fns/isValid/index.js';
import { el, enUS } from "https://deno.land/x/date_fns/locale/index.js";

const plainDatafile: string = 'data_plain.json';
const augmentedDatafile: string = 'data_augmented.json';
const fullDatafile: string = 'data_full.json';
const statefile: string = 'state.json';
const daysRegExp: RegExp = /(Δευτέρα|Τρίτη|Τετάρτη|Πέμπτη|Παρασκευή|Σάββατο|Κυριακή)/;
const dateRangeRegExp: RegExp = /([α-ωίϊΐόάέύϋΰήώ]+)(έως|εως|εώς)([α-ωίϊΐόάέύϋΰήώ]+),(\d+)([α-ωίϊΐόάέύϋΰήώ]+)?(έως|εως|εώς|–)(\d+)([α-ωίϊΐόάέύϋΰήώ]+)(\d{4})/; 
const fuelCategoriesRegExp: RegExp = /(Βενζίνες|Πετρέλαια|Υγραέρια – LPG|ΜΑΖΟΥΤ-FUEL OIL|ΚΗΡΟΖΙΝΗ – KERO|ΑΣΦΑΛΤΟΣ) \((.+)\)/;
const ignoreRegExp: RegExp = /ΕΛ.ΠΕ.|Motor Oil|EX-FACTORY|ΧΠ: Χειμερινή Περίοδος/;
const volumeRegExp: RegExp = /τιμές σε €\/m3/;

export function parseOilPage(html:string): object[] {
  try {
    const document: any = new DOMParser().parseFromString(html, 'text/html');
    const tbody: any = document.querySelector('tbody');

    let candidateDates: string = '';
    let sanitizedDates: string = '';
    let parsedDates: Date[] = new Array();
    let category: string = '';
    let notes: string = '';
    let data:object[] = new Array();

    let i:number;
    for (i=0; i < tbody.children.length; i++) {
      if (daysRegExp.test(tbody.children[i].textContent)) {
        candidateDates = tbody.children[i].textContent.trim();
        sanitizedDates = sanitizeDates(candidateDates);
        parsedDates = parseDates(sanitizedDates);
      } else if (fuelCategoriesRegExp.test(tbody.children[i].textContent)) {
        let match: string[] = tbody.children[i].textContent.match(fuelCategoriesRegExp);
        category = match[1];
        notes = match[2];
      } else if (ignoreRegExp.test(tbody.children[i].textContent)) {
        // do nothing, we don't care
      } else {
       // Here we go, we are parsing actual prices now
        let tds: any = tbody.children[i].children;
        let fuelName: string = tds[0].textContent.trim();
        let elpePrice: number = parseFloat(tds[1].textContent.replace(/\./, '').replace(/,/, '.'));
        let motoroilPrice: number = parseFloat(tds[2].textContent.replace(/\./, '').replace(/,/, '.'));
        // And let's create the objects
        for (let parsedDate of parsedDates) {
          let datum = {
            parsedDate: parsedDate.toISOString().split('T')[0],
            category: category,
            notes: notes,
            fuelName: fuelName,
            elpePrice: elpePrice,
            motoroilPrice: motoroilPrice,
          };
          data.push(datum);
        }
      }
    }
    return data;
  } catch(error) {
    console.log(error);
    return new Array();
  }
}

function sanitizeDates(input:string): string {
  let dates: string = '';
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

function getDateRange(candidateDates:string): string[] {
  let dates: string[] = new Array();
  let match: RegExpMatchArray | null = candidateDates.match(dateRangeRegExp);
  if (match) {
    let startweekday: string = match[1];
    let stopweekday: string = match[3];
    let startmonthday: string = match[4];
    let stopmonthday: string = match[7];
    let startmonth: string = '';
    let stopmonth: string = match[8];
    if (match[5]) {
      startmonth = match[5];
    } else {
      startmonth = stopmonth;
    }
    let year: string = match[9];
    let startdate: string = `${startweekday},${startmonthday}${startmonth}${year}`;
    let stopdate: string = `${stopweekday},${stopmonthday}${stopmonth}${year}`;
    dates.push(startdate);
    dates.push(stopdate);
  } else {
    dates.push(candidateDates);
  }
  return dates;
}

function parseDates(candidateDates:string): Date[] {
  const dateString: string = 'EEEE,dMMMMyyyy';
  let dates: Date[] = new Array();
  let dateRange: string[] = getDateRange(candidateDates);

  for (let date of dateRange) {
    let parsedDate: Date = parse(date, dateString, new Date(), {locale: el});
    if (!isValid(parsedDate)) {
      console.log('Date invalid: ' + date);
      continue;
    }
    dates.push(parsedDate);
  }
  // Let's see if we had a date range after all and we need to augment it
  if (dates.length == 2) {
    let duration: number = dates[1] - dates[0];
    let extradays: number = (duration / 86400000) - 1;
    for (let i: number=1; i <= extradays; i++) {
      let newdate: Date = new Date(dates[0]);
      newdate.setDate(newdate.getDate() + i);
      dates.push(newdate);
    }
  }
  return dates.sort();
}

async function parseUnParsed(xml:string): Promise<object[]> {
  try {
    let ret: object[] = new Array();
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
    return new Array();
  }
}

function stripNulls(data: object[]): object[] {
  let ret: object[] = new Array();
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
      if (!datum.vat24Price_per_lt) {
        delete datum.vat24Price_per_lt;
      }
      if (!datum.vat17Price_per_lt) {
        delete datum.vat17Price_per_lt;
        delete datum.vat17notes;
      }
    ret.push(datum);
    }
    return ret;
  } catch(error) {
    console.log(error);
  }
}

function addMeanValue(data: object[]): object[] {
  let ret: object[] = new Array();
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
    return new Array();
  }
}

function addVAT(data: object[]): object[] {
  let ret: object[] = new Array();
  try {
    for (let datum of data) {
      if (volumeRegExp.test(datum.notes)) {
        datum.vat24Price_per_lt = datum.meanPrice * 1.24 / 1000;
        datum.vat17Price_per_lt = datum.meanPrice * 1.17 / 1000;
        datum.vat17notes = 'Only for Λέρο, Λέσβο, Κω, Σάμο και Χίο';
      }
      ret.push(datum);
    }
    return ret;
  } catch(error) {
    console.log(error);
    return new Array();
  }
}

async function appendData(data: object[], datafile: string): Promise<void> {
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

export async function writeDataFiles(data: object[]): Promise<void> {
    // Write the original data
    await appendData(data, fullDatafile);
    // Add mean price
    let augmented: object[] = addMeanValue(data);
    augmented = addVAT(augmented);
    await appendData(augmented, augmentedDatafile);
    // Remove nulls,NaNs
    let plain: object[] = stripNulls(augmented);
    await appendData(plain, plainDatafile);
}

try {
  const xmlfile:string = Deno.args[0]
  if (xmlfile) {
    const xml:string = await readTXT(xmlfile);
    let parsed: object[] = await parseUnParsed(xml);
    await writeDataFiles(parsed);
  }
} catch(error) {
  console.log(error);
}