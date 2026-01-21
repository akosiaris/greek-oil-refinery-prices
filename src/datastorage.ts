import { DB, readCSV, readJSON, writeCSV, writeJSON } from "../deps.ts";
import { FuelEntry } from "./FuelEntry.ts";

const csvdatafile = "fuels.csv";
const jsondatafile = "fuels.json";
const sqlitedatafile = "fuels.db";
const sqlitedatafile_2nf = "fuels_2nf.db";

/**
 * Appends JSON data to an existing data file.
 *
 * @param data - The data to be appended.
 * @param datafile - The path to the data file.
 * @returns A Promise that resolves when the data has been appended successfully.
 */
async function appendJSONData(
  data: FuelEntry[],
  datafile: string,
): Promise<void> {
  let jsondata;
  try {
    jsondata = await readJSON(datafile);
    jsondata = jsondata.concat(data);
  } catch (_error) {
    jsondata = data;
  }
  try {
    await writeJSON(datafile, jsondata, null, 2);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Appends the given data to a CSV file.
 *
 * @param data - The data to be appended.
 * @param datafile - The path of the CSV file.
 * @returns A Promise that resolves when the data has been appended successfully.
 */
async function appendCSVData(
  data: FuelEntry[],
  datafile: string,
): Promise<void> {
  let csvdata: Record<string, unknown>[];
  try {
    csvdata = await readCSV(datafile);
    csvdata = csvdata.concat(data.map(function (val) {
      return val.recordize();
    }));
  } catch (_error) {
    csvdata = data.map(function (val) {
      return val.recordize();
    });
  }
  try {
    await writeCSV(datafile, csvdata);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Appends the given data to an SQLite database file.
 * Table is in 1st Normal Form (1NF). That is no cell contains more than one value.
 *
 * @param data - The array of fuel entries to be appended.
 * @param datafile - The path to the SQLite database file.
 */
function appendSQLiteData_1NF(data: FuelEntry[], datafile: string): void {
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
    unit TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS idx_fuels_date ON fuels(date);
  `);
  const query = db.prepareQuery<never, never, {
    date: string;
    category: string;
    notes: string;
    fuel: string;
    elpePrice: number;
    motoroilPrice: number;
    meanPrice: number;
    vatPrice: number;
    unit: string;
  }>(`
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
    query.execute(entry.recordize());
  }
  query.finalize();
}

/**
 * Appends the given data to an SQLite database file.
 * Table is in 2nd Normal Form (2NF). This means that the table is in 1NF
 * and all non-key attributes are fully functional dependent on the primary key.
 *
 * @param data - The array of fuel entries to be appended.
 * @param datafile - The path to the SQLite database file.
 */
function appendSQLiteData_2NF(data: FuelEntry[], datafile: string): void {
  const db = new DB(datafile);
  db.execute(`
  CREATE TABLE IF NOT EXISTS categories (
    id integer PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL UNIQUE,
    notes TEXT NOT NULL,
    unit TEXT NOT NULL);

  CREATE TABLE IF NOT EXISTS fuels (
    date TEXT NOT NULL,
    category_id integer NOT NULL,
    fuel TEXT NOT NULL,
    elpePrice REAL,
    motoroilPrice REAL,
    meanPrice REAL,
    vatPrice REAL,
    FOREIGN KEY (category_id) REFERENCES categories(id));
  CREATE INDEX IF NOT EXISTS idx_fuels_date ON fuels(date);
  `);
  const fetch_category_id_query = db.prepareQuery<
    [number],
    { id: number },
    { category: string }
  >(`
    SELECT id FROM categories WHERE category = :category
  `);
  const insert_category = db.prepareQuery<
    never,
    never,
    { category: string; notes: string; unit: string }
  >(`
    INSERT INTO categories (category, notes, unit) VALUES (:category, :notes, :unit)
  `);
  const insert_fuel = db.prepareQuery<never, never, {
    date: string;
    category_id: number;
    fuel: string;
    elpePrice: number;
    motoroilPrice: number;
    meanPrice: number;
    vatPrice: number;
  }>(`
  INSERT INTO fuels (
    date,
    category_id,
    fuel,
    elpePrice,
    motoroilPrice,
    meanPrice,
    vatPrice) VALUES (
      :date,
      :category_id,
      :fuel,
      :elpePrice,
      :motoroilPrice,
      :meanPrice,
      :vatPrice)
  `);
  for (const entry of data) {
    const category_id = fetch_category_id_query.firstEntry({
      category: entry["category"],
    });
    if (category_id === undefined) {
      insert_category.allEntries({
        category: entry.category,
        notes: entry.notes,
        unit: entry.unit,
      });
      const category = db.lastInsertRowId;
      insert_fuel.execute({
        date: entry.date.toISOString(),
        category_id: category,
        fuel: entry.fuel,
        elpePrice: entry.elpePrice,
        motoroilPrice: entry.motoroilPrice,
        meanPrice: entry.meanPrice,
        vatPrice: entry.vatPrice,
      });
    } else {
      insert_fuel.execute({
        date: entry.date.toISOString(),
        category_id: category_id.id,
        fuel: entry.fuel,
        elpePrice: entry.elpePrice,
        motoroilPrice: entry.motoroilPrice,
        meanPrice: entry.meanPrice,
        vatPrice: entry.vatPrice,
      });
    }
  }
  fetch_category_id_query.finalize();
  insert_category.finalize();
  insert_fuel.finalize();
}

/**
 * Writes the data to the data files.
 * @param data - The fuel entry data to be written.
 * @returns A promise that resolves when the data has been written.
 */
export async function writeDataFiles(data: FuelEntry[]): Promise<void> {
  // Write the original data
  await appendJSONData(data, jsondatafile);
  await appendCSVData(data, csvdatafile);
  appendSQLiteData_1NF(data, sqlitedatafile);
  appendSQLiteData_2NF(data, sqlitedatafile_2nf);
}
