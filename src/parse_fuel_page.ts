import { DOMParser, Element, HTMLDocument, parseISO } from "../deps.ts";
import { FuelEntry } from "./FuelEntry.ts";
import { DetectAndHandleDates } from "./parsedates.ts";
import { isBefore } from "../deps.ts";
import { parse_api_posts } from "./parse_json_api.ts";

const fuelCategoriesRegExp =
  /(Βενζίνες|Πετρέλαια|Υγραέρια – LPG|ΜΑΖΟΥΤ-FUEL OIL|ΚΗΡΟΖΙΝΗ – KERO|ΑΣΦΑΛΤΟΣ) \((.+)\)/;
const ignoreRegExp = /ΕΛ.ΠΕ.|Motor Oil|EX-FACTORY|ΧΠ: Χειμερινή Περίοδος|\n\n/;

/**
 * Parses the fuel page HTML and returns an array of FuelEntry objects.
 * This function is meant to be able to parse all variants of fuel pages. In practice, only the 2019-present variant is supported.
 *
 * @param html - The HTML content of the fuel page.
 * @returns An array of FuelEntry objects representing the parsed fuel prices.
 */
export function parseFuelPage(input: string|Record<string, Record<string, string|number>[]>): FuelEntry[] {
  const today = new Date();
  // After 2025-11-05, the site was radically changed and we need a different handling method
  const target = parseISO('2025-11-05', {});
  if (isBefore(today, target)) {
    return parseFuelPage_2019_to_2025_11_05(input as string);
  } else {
    return parse_api_posts(input as Record<string, Record<string, string|number>[]>);
  }
}

/**
 * Parses the fuel page HTML from 2019 to present and returns an array of FuelEntry objects.
 *
 * @param html - The HTML content of the fuel page.
 * @returns An array of FuelEntry objects representing the parsed fuel prices.
 */
function parseFuelPage_2019_to_2025_11_05(html: string): FuelEntry[] {
  try {
    const document: HTMLDocument | null = new DOMParser().parseFromString(
      html,
      "text/html",
    );
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
        const match: RegExpMatchArray | null = tbody.children[i].textContent
          .match(fuelCategoriesRegExp);
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
        const elpePrice: number = parseFloat(
          tds[1].textContent.replace(/\./, "").replace(/,/, "."),
        );
        const motoroilPrice: number = parseFloat(
          tds[2].textContent.replace(/\./, "").replace(/,/, "."),
        );
        // And let's create the objects
        for (const parsedDate of parsedDates) {
          const dtmp: Date = new Date(parsedDate.toISOString().split("T")[0]);
          const fuel = new FuelEntry(
            dtmp,
            category,
            notes,
            fuelName,
            elpePrice,
            motoroilPrice,
          );
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
