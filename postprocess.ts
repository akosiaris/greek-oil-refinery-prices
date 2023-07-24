import { readCSV, writeCSV } from 'https://deno.land/x/flat/mod.ts';
import { DB } from 'https://deno.land/x/sqlite/mod.ts';
import { FuelEntry } from './FuelEntry.ts';
import { env } from 'node:process';
import { DetectAndHandleDates } from './parsedates.ts';
import {
  DOMParser,
  Element,
  HTMLDocument,
  parseFeed,
  readTXT,
  readJSON,
  writeJSON,
} from './deps.ts';

const csvdatafile = 'fuels.csv';
const jsondatafile = 'fuels.json';
const sqlitedatafile = 'fuels.db';
const statefile = 'state.json';


const fuelCategoriesRegExp = /(Βενζίνες|Πετρέλαια|Υγραέρια – LPG|ΜΑΖΟΥΤ-FUEL OIL|ΚΗΡΟΖΙΝΗ – KERO|ΑΣΦΑΛΤΟΣ) \((.+)\)/;
const ignoreRegExp = /ΕΛ.ΠΕ.|Motor Oil|EX-FACTORY|ΧΠ: Χειμερινή Περίοδος/;

export function parseFuelPage(html: string): FuelEntry[] {
  try {
    const document: HTMLDocument | null = new DOMParser().parseFromString(html, 'text/html');
    if (!document) {
        return [];
    }
    const tbody: Element | null = document.querySelector('tbody');
    if (!tbody) {
        return [];
    }

    let parsedDates: Date[] = [];
    let category = '';
    let notes = '';
    const fuels: FuelEntry[] = [];

    let i: number;
    for (i=0; i < tbody.children.length; i++) {
      const tmp: Date[] = DetectAndHandleDates(tbody.children[i].textContent);
      if (tmp) {
        parsedDates = tmp;
      } else if (fuelCategoriesRegExp.test(tbody.children[i].textContent)) {
        const match: RegExpMatchArray | null = tbody.children[i].textContent.match(fuelCategoriesRegExp);
        if (match) {
            category = match[1];
            notes = match[2];
        }
      } else if (ignoreRegExp.test(tbody.children[i].textContent)) {
        // do nothing, we don't care
      } else {
       // Here we go, we are parsing actual prices now
        // deno-lint-ignore no-explicit-any
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
    return [];
  }
}

async function appendJSONData(data: FuelEntry[], datafile: string): Promise<void> {
  let jsondata;
  try {
    jsondata  = await readJSON(datafile);
    jsondata = jsondata.concat(data);
  } catch(_error) {
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
  } catch(_error) {
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

async function main(): Promise<void> {
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
}

if (import.meta.main) {
  await main()
}