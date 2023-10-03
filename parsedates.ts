import { el, intervalToDuration, isValid, parse } from "./deps.ts";

const dateRangeRegExp =
  /([α-ωίϊΐόάέύϋΰήώ]+)(έως|εως|εώς)([α-ωίϊΐόάέύϋΰήώ]+),(\d+)([α-ωίϊΐόάέύϋΰήώ]+)?(έως|εως|εώς|–)(\d+)([α-ωίϊΐόάέύϋΰήώ]+)(\d{4})/;
const daysRegExp = /(Δευτέρα|Τρίτη|Τετάρτη|Πέμπτη|Παρασκευή|Σάββατο|Κυριακή)/;

export function DetectAndHandleDates(input: string): Date[] {
  if (daysRegExp.test(input)) {
    const candidateDates: string = input.trim();
    const sanitizedDates: string = sanitizeDates(candidateDates);
    return parseDates(sanitizedDates);
  }
  return [];
}

/**
 * A function that normalizes various date formats variations using some heuristics to make the resulting
 * string easier to parse
 *
 * @param input The input string to normalize. - string
 * @returns The normalized string - string
 */
function sanitizeDates(input: string): string {
  // Remove great from days
  let dates: string = input.replace("Μεγάλο", "").replace("Μεγάλη", "").replace("Μεγ.", "");
  // Normalize string, e.g. get rid of unicode no break spaces
  dates = dates.normalize("NFKC");
  // Remove all spaces now, the original data can be inconsistent anyway
  dates = dates.replaceAll(" ", "");
  // Lowercase too as the original data can be inconsistent anyway
  dates = dates.toLowerCase();
  // Selectively fix a mess with diacritics and accents, hopefully it won't become larger than this
  dates = dates.replace("μαϊου", "μαΐου").replace("μάϊου", "μαΐου").replace("ιουνιου", "ιουνίου");
  return dates;
}

/**
 * A function to figure out if an input string containers more than 1 date. It will always return an array of size 1 at least
 *
 * @param candidateDates The input string - string
 * @returns An array of strings containing candidate dates
 */
function getDateRange(candidateDates: string): string[] {
  const dates: string[] = [];
  const match: RegExpMatchArray | null = candidateDates.match(dateRangeRegExp);
  if (match) {
    const startweekday: string = match[1];
    const stopweekday: string = match[3];
    const startmonthday: string = match[4];
    const stopmonthday: string = match[7];
    let startmonth = "";
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

/**
 * @param candidateDates A string containing the candidate dates.
 * @returns An array of dates.
 */
function parseDates(candidateDates: string): Date[] {
  const dateString = "EEEE,dMMMMyyyy";
  const dates: Date[] = [];
  const dateRange: string[] = getDateRange(candidateDates);

  for (const date of dateRange) {
    const parsedDate: Date = parse(date, dateString, new Date(), { locale: el });
    if (!isValid(parsedDate)) {
      console.log("Date invalid: " + date);
      continue;
    }
    dates.push(parsedDate);
  }
  // Let's see if we had a date range after all and we need to augment it
  if (dates.length == 2) {
    const duration = intervalToDuration({
      start: dates[0],
      end: dates[1],
    });
    const extradays: number = duration.days - 1;
    // const extradays: number = (duration / 86400000) - 1;
    for (let i = 1; i <= extradays; i++) {
      const newdate: Date = new Date(dates[0]);
      newdate.setDate(newdate.getDate() + i);
      dates.push(newdate);
    }
  }
  return dates.sort();
}

export const sanitizeDates_test = sanitizeDates;
export const parseDates_test = parseDates;
export const getDateRange_test = getDateRange;
