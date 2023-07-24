import {
    DB,
    readJSON,
    writeJSON,
    readCSV,
    writeCSV,
 } from './deps.ts';
import { FuelEntry } from './FuelEntry.ts';

const csvdatafile = 'fuels.csv';
const jsondatafile = 'fuels.json';
const sqlitedatafile = 'fuels.db';

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
  let csvdata: Record<string, unknown>[];
  try {
    csvdata  = await readCSV(datafile);
    csvdata = csvdata.concat(data.map(function(val) { return val.recordize() } ));
  } catch(_error) {
    csvdata = data.map(function(val) { return val.recordize() } );
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