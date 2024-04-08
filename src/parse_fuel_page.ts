import { DOMParser, Element, HTMLDocument } from "../deps.ts";
import { FuelEntry } from "./FuelEntry.ts";
import { DetectAndHandleDates } from "./parsedates.ts";

const fuelCategoriesRegExp = /(Βενζίνες|Πετρέλαια|Υγραέρια – LPG|ΜΑΖΟΥΤ-FUEL OIL|ΚΗΡΟΖΙΝΗ – KERO|ΑΣΦΑΛΤΟΣ) \((.+)\)/;
const ignoreRegExp = /ΕΛ.ΠΕ.|Motor Oil|EX-FACTORY|ΧΠ: Χειμερινή Περίοδος/;

export function parseFuelPage(html: string): FuelEntry[] {
  return parseFuelPage_2019_present(html);
}

function parseFuelPage_2019_present(html: string): FuelEntry[] {
  try {
    const document: HTMLDocument | null = new DOMParser().parseFromString(html, "text/html");
    if (!document) {
      return [];
    }
    const tbody: Element | null = document.querySelector("tbody");
    if (!tbody) {
      return [];
    }

    let parsedDates: Date[] = [];
    let category = "";
    let notes = "";
    const fuels: FuelEntry[] = [];

    let i: number;
    for (i = 0; i < tbody.children.length; i++) {
      const tmp: Date[] = DetectAndHandleDates(tbody.children[i].textContent);
      if (tmp.length > 0) {
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
        const elpePrice: number = parseFloat(tds[1].textContent.replace(/\./, "").replace(/,/, "."));
        const motoroilPrice: number = parseFloat(tds[2].textContent.replace(/\./, "").replace(/,/, "."));
        // And let's create the objects
        for (const parsedDate of parsedDates) {
          const dtmp: Date = new Date(parsedDate.toISOString().split("T")[0]);
          const fuel = new FuelEntry(dtmp, category, notes, fuelName, elpePrice, motoroilPrice);
          fuels.push(fuel);
        }
      }
    }
    return fuels;
  } catch (error) {
    console.log(error);
    return [];
  }
}
