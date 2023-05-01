import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';
import { readTXT, readJSON, writeJSON, readCSV, writeCSV } from 'https://deno.land/x/flat/mod.ts';
import { DB } from 'https://deno.land/x/sqlite/mod.ts';
import { parseFeed } from 'https://deno.land/x/rss/mod.ts';
import parse from 'https://deno.land/x/date_fns/parse/index.js';
import isValid from 'https://deno.land/x/date_fns/isValid/index.js';
import { el } from 'https://deno.land/x/date_fns/locale/index.js';
import { FuelEntry } from './FuelEntry.ts';
import { env } from 'node:process';

const csvdatafile = 'fuels.csv';
const jsondatafile = 'fuels.json';
const sqlitedatafile = 'fuels.db';
const statefile = 'state.json';
const daysRegExp = /(Δευτέρα|Τρίτη|Τετάρτη|Πέμπτη|Παρασκευή|Σάββατο|Κυριακή)/;
const dateRangeRegExp = /([α-ωίϊΐόάέύϋΰήώ]+)(έως|εως|εώς)([α-ωίϊΐόάέύϋΰήώ]+),(\d+)([α-ωίϊΐόάέύϋΰήώ]+)?(έως|εως|εώς|–)(\d+)([α-ωίϊΐόάέύϋΰήώ]+)(\d{4})/;
const fuelCategoriesRegExp = /(Βενζίνες|Πετρέλαια|Υγραέρια – LPG|ΜΑΖΟΥΤ-FUEL OIL|ΚΗΡΟΖΙΝΗ – KERO|ΑΣΦΑΛΤΟΣ) \((.+)\)/;
const ignoreRegExp = /ΕΛ.ΠΕ.|Motor Oil|EX-FACTORY|ΧΠ: Χειμερινή Περίοδος/;

export function parseFuelPage(html: string): FuelEntry[] {
  try {
    const document: any = new DOMParser().parseFromString(html, 'text/html');
    const tbody: any = document.querySelector('tbody');

    let candidateDates = '';
    let sanitizedDates = '';
    let parsedDates: Date[] = new Array();
    let category = '';
    let notes = '';
    const fuels: FuelEntry[] = new Array();

    let i: number;
    for (i=0; i < tbody.children.length; i++) {
      if (daysRegExp.test(tbody.children[i].textContent)) {
        candidateDates = tbody.children[i].textContent.trim();
        sanitizedDates = sanitizeDates(candidateDates);
        parsedDates = parseDates(sanitizedDates);
      } else if (fuelCategoriesRegExp.test(tbody.children[i].textContent)) {
        const match: string[] = tbody.children[i].textContent.match(fuelCategoriesRegExp);
        category = match[1];
        notes = match[2];
      } else if (ignoreRegExp.test(tbody.children[i].textContent)) {
        // do nothing, we don't care
      } else {
       // Here we go, we are parsing actual prices now
        const tds: any = tbody.children[i].children;
        const fuelName: string = tds[0].textContent.trim();
        const elpePrice: number = parseFloat(tds[1].textContent.replace(/\./, '').replace(/,/, '.'));
        const motoroilPrice: number = parseFloat(tds[2].textContent.replace(/\./, '').replace(/,/, '.'));
        // And let's create the objects
        for (const parsedDate of parsedDates) {
          const dtmp: Date = new Date(parsedDate.toISOString().split('T')[0]);
          const fuel = new FuelEntry(dtmp, category, notes, fuelName, elpePrice, motoroilPrice);
          fuels.push(fuel);
        }
      }
    }
    return fuels;
  } catch(error) {
    console.log(error);
    return new Array();
  }
}

function sanitizeDates(input: string): string {
  // Remove great from days
  let dates: string = input.replace('Μεγάλο', '').replace('Μεγάλη', '').replace('Μεγ.', '');
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

function getDateRange(candidateDates: string): string[] {
  const dates: string[] = new Array();
  const match: RegExpMatchArray | null = candidateDates.match(dateRangeRegExp);
  if (match) {
    const startweekday: string = match[1];
    const stopweekday: string = match[3];
    const startmonthday: string = match[4];
    const stopmonthday: string = match[7];
    let startmonth = '';
    const stopmonth: string = match[8];
    if (match[5]) {
      startmonth = match[5];
    } else {
      startmonth = stopmonth;
    }
    const year: string = match[9];
    const startdate = `${startweekday},${startmonthday}${startmonth}${year}`;
    const stopdate = `${stopweekday},${stopmonthday}${stopmonth}${year}`;
    dates.push(startdate);
    dates.push(stopdate);
  } else {
    dates.push(candidateDates);
  }
  return dates;
}

function parseDates(candidateDates: string): Date[] {
  const dateString = 'EEEE,dMMMMyyyy';
  const dates: Date[] = new Array();
  const dateRange: string[] = getDateRange(candidateDates);

  for (const date of dateRange) {
    const parsedDate: Date = parse(date, dateString, new Date(), {locale: el});
    if (!isValid(parsedDate)) {
      console.log('Date invalid: ' + date);
      continue;
    }
    dates.push(parsedDate);
  }
  // Let's see if we had a date range after all and we need to augment it
  if (dates.length == 2) {
    const duration: number = dates[1] - dates[0];
    const extradays: number = (duration / 86400000) - 1;
    for (let i=1; i <= extradays; i++) {
      const newdate: Date = new Date(dates[0]);
      newdate.setDate(newdate.getDate() + i);
      dates.push(newdate);
    }
  }
  return dates.sort();
}

async function parseUnParsed(xml: string): Promise<FuelEntry[]> {
  try {
    let ret: FuelEntry[] = new Array();
    var statedata  = await readJSON(statefile);
    const {entries} = await parseFeed(xml);
    for (const entry of entries) {
      if (!(entry.id in statedata)) {
        const freshdata: FuelEntry[] = parseFuelPage(entry.content.value);
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

async function appendJSONData(data: FuelEntry[], datafile: string): Promise<void> {
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

async function appendCSVData(data: FuelEntry[], datafile: string): Promise<void> {
  let csvdata;
  try {
    csvdata  = await readCSV(datafile);
    csvdata = csvdata.concat(data);
  } catch(error) {
    csvdata = data;
  }
  try {
    await writeCSV(datafile, csvdata);
  } catch(error) {
    console.log(error);
  }
}

function appendSQLiteData(data: FuelEntry[], datafile: string): void {
  const db = new DB(datafile);
  db.execute(`
  CREATE TABLE IF NOT EXISTS fuels (
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    notes TEXT NOT NULL,
    fuel TEXT NOT NULL,
    elpePrice REAL,
    motoroilPrice REAL,
    meanPrice REAL,
    vatPrice REAL,
    unit TEXT NOT NULL)
  `);
  const query = db.prepareQuery<never, never, {
    date: string,
    category: string,
    notes: string,
    fuel: string,
    elpePrice: number,
    meanPrice: number,
    vatPrice: number,
    unit: string }>
  (`
  INSERT INTO fuels (
    date,
    category,
    notes,
    fuel,
    elpePrice,
    motoroilPrice,
    meanPrice,
    vatPrice,
    unit) VALUES (
      :date,
      :category,
      :notes,
      :fuel,
      :elpePrice,
      :motoroilPrice,
      :meanPrice,
      :vatPrice,
      :unit)`);
  for (const entry of data) {
    query.execute(entry);
  }
  query.finalize();
}

export async function writeDataFiles(data: FuelEntry[]): Promise<void> {
    // Write the original data
    await appendJSONData(data, jsondatafile);
    await appendCSVData(data, csvdatafile);
    appendSQLiteData(data, sqlitedatafile);
}

try {
  const xmlfile: string = Deno.args[0]
  const elasticsearch_url = env['ELASTICSEARCH_URL'];
  const elasticsearch_username = env['ELASTICSEARCH_USERNAME']
  const elasticsearch_password = env['ELASTICSEARCH_PASSWORD'];
  const b64 = btoa(elasticsearch_username + ':' + elasticsearch_password);

  if (xmlfile) {
    const xml: string = await readTXT(xmlfile);
    const parsed: FuelEntry[] = await parseUnParsed(xml);
    await writeDataFiles(parsed);
    if (elasticsearch_url) {
      /* Now, let's post them to elasticsearch */
      for (const entry of parsed) {
          const response = await fetch(elasticsearch_url, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Basic ' + b64,
              },
              body: JSON.stringify(entry),
          });
          if (response.status != 201) {
            // POST failed, log why
            console.log(response);
          }
      }
    }
  }
} catch(error) {
  console.log(error);
}