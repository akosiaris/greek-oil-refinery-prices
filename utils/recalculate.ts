// Purpose: Recalculate all files based on 1 input file

import { FuelEntry } from "../src/FuelEntry.ts";
import { readJSON } from "../deps.ts";
import { writeDataFiles } from "../src/datastorage.ts";

try {
  const inputfile: string = Deno.args[0];
  const data = await readJSON(inputfile);
  const fueldata: FuelEntry[] = data.map(function (val) {
    return new FuelEntry(
        val.date,
        val.category,
        val.notes,
        val.fuel,
        val.elpePrice,
        val.motoroilPrice
    )
  });
  writeDataFiles(fueldata);
} catch (error) {
    console.log(error);
}