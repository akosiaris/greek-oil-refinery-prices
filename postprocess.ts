import { FuelEntry } from './FuelEntry.ts';
import { env } from 'node:process';
import { DetectAndHandleDates } from './parsedates.ts';
import { parseUnParsed } from './feedparse.ts';
import { writeDataFiles } from './datastorage.ts';
import {
  DOMParser,
  Element,
  HTMLDocument,
  readTXT,
} from './deps.ts';

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


async function main(): Promise<void> {
  try {
    const xmlfile: string = Deno.args[0]
    const elasticsearch_url = env['ELASTICSEARCH_URL'];
    const elasticsearch_username = env['ELASTICSEARCH_USERNAME']
    const elasticsearch_password = env['ELASTICSEARCH_PASSWORD'];
    const b64 = btoa(elasticsearch_username + ':' + elasticsearch_password);

    if (xmlfile) {
      const xml: string = await readTXT(xmlfile);
      const parsed: FuelEntry[] = await parseUnParsed(xml, statefile);
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