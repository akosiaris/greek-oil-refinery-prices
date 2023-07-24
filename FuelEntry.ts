// Schema validation imports
/*  TODO: Honestly, I have no idea what I am doing with the imports here. I 've
    ended up with something that looks wrong for some reason, but works with deno,
    without having to use npm directly. I am pretty sure I 'll have to revisit this,
    but one thing at a time. The 2 things that bug me are:
    * Usage of that .default thing.
    * Needing to put .js at the end of 2020, but not for ajv-formats
*/
import Ajv2020 from "npm:ajv/dist/2020.js";
import addFormats from "npm:ajv-formats";
const ajv = new Ajv2020.default({coerceTypes: true});
addFormats.default(ajv);

// Used for VAT calculation
import { VAT } from './VAT.ts';
import fuel_schema from './schema.json' assert {type: 'json'};

// RegExps for parsing notes to produce units, VAT
const volumeRegExp = /τιμές σε €\/m3/;
const massRegExp = /τιμές σε €\/μ.τ./;
const missingOnlyVATRegExp = /συμπεριλ. φόρων – τελών, προ ΦΠΑ/;

// Type to limit the values for fuel categories. String Literal
type FuelCategory = 'Βενζίνες' | 'Πετρέλαια' | 'Υγραέρια – LPG' | 'ΜΑΖΟΥΤ-FUEL OIL' | 'ΚΗΡΟΖΙΝΗ – KERO' | 'ΑΣΦΑΛΤΟΣ';
// Type to limit the values for fuel names. String Literal
type FuelName = 'DIΕSEL AUTO BIO' | 'Fuel Oil No 180 1%S' | 'Fuel Oil No 380 1%S' | 'HEATING GASOIL' | 'HEATING GASOIL (Χ.Π)' | 'HEATING GASOIL (ΧΠ)' | 'KERO' | 'KERO SPECIAL' | 'LPG AUTO' | 'LPG ΒΙΟΜΗΧΑΝΙΑΣ' | 'LPG ΘΕΡΜΑΝΣΗΣ' | 'UNLEADED 100' | 'UNLEADED 100 BIO' | 'UNLEADED 95' | 'UNLEADED 95 BIO' | 'UNLEADED LRP' | 'UNLEADED LRP BIO' | 'ΒΕΑ 30/45' | 'ΒΕΑ 35/40' | 'ΒΕΑ 50/70 & 70/100' | 'ΒΕΘ 50/70' | 'ΒΟΥΤΑΝΙΟ ΒΙΟΜΗΧΑΝΙΑΣ' | 'ΠΡΟΠΑΝΙΟ ΒΙΟΜΗΧΑΝΙΑΣ';
// Type to limit the values for notes. Interestingly they are rather well structured, more than FuelNames. String Literal
type Notes = 'τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ' | 'τιμές σε €/μ.τ., προ φόρων – τελών και ΦΠΑ' | 'τιμές σε €/μ.τ., συμπεριλ. φόρων – τελών, προ ΦΠΑ';
// Type to limit values of units. Is this fuel counted in mass? or volume ?. String Literal
type Unit = 'Κυβικό Μέτρο' | 'Μετρικός Τόνος' | 'Άγνωστο';

// Let's compile the schema
const validate_fuel = ajv.compile<FuelEntry>(fuel_schema);

type Usable = {
  date: string,
  category: string,
  notes: string,
  fuel: string,
  elpePrice: number,
  motoroilPrice: number,
  meanPrice: number,
  vatPrice: number,
  unit: string
};

/**
 * A class to represent a single entry of the Fuel data.
 *
 * @alpha
 */
export class FuelEntry {
  // naive (not timezeone aware) date
  public date: Date;
  // Category of product, e.g. 'Βενζινες'
  public category: FuelCategory;
  public notes: Notes;
  // name of product, e.g. 'DIΕSEL AUTO BIO'
  public fuel: FuelName;
  // Prices for the 2 large oil distilleries
  public elpePrice: number;
  public motoroilPrice: number;
  public meanPrice: number;
  public vatPrice: number;
  public unit: Unit;

  /**
   * Constructs a FuelEntry
   *
   * @param date - Date type, the date of the record
   * @param category - The category of the record
   * @param notes - Some notes about the record
   * @param fuel - The name of the fuel
   * @param elpePrice - The price of ΕΛ.ΠΕ.
   * @param motoroilPrice - The price of MotorOil
   */
  public constructor(date: Date | string, category: string, notes: string, fuel: string, elpePrice = NaN, motoroilPrice = NaN) {
    if (typeof date === 'string') {
      this.date = new Date(date);
    } else {
      this.date = date;
    }
    this.category = category as FuelCategory;
    this.notes = notes as Notes;
    this.fuel = fuel as FuelName;
    this.elpePrice = elpePrice;
    this.motoroilPrice = motoroilPrice;

    this.unit = this.deriveUnit();
    this.meanPrice = this.calculateMeanPrice();
    this.vatPrice = this.calculateVAT();
  }

  /**
   * Calcuates the mean price of ΕΛ.ΠΕ. and MotorOil
   */
  private calculateMeanPrice(): number {
    let meanPrice: number;
    if (this.elpePrice && this.motoroilPrice) {
      meanPrice = (this.elpePrice + this.motoroilPrice) / 2;
    } else if (this.elpePrice) {
      meanPrice = this.elpePrice;
    } else if (this.motoroilPrice) {
      meanPrice = this.motoroilPrice;
    } else {
      meanPrice = NaN;
    }
    // Rounding to 3 digits. Javascript sucks
    return parseFloat(meanPrice.toFixed(3));
  }

  /**
   * Calculates and set the unit property based on the notes
   */
  private deriveUnit(): Unit {
    if (volumeRegExp.test(this.notes)) {
      return 'Κυβικό Μέτρο';
    } else if (massRegExp.test(this.notes))  {
      return 'Μετρικός Τόνος';
    } else {
      console.log('Could not figure out Unit, notes field is: ' + this.notes);
      return 'Άγνωστο';
    }
  }

  /**
   * Adds VAT property. Only some fuel types will have that added
   */
  private calculateVAT(): number {
    if (missingOnlyVATRegExp.test(this.notes)) {
      const vatPrice: number = this.meanPrice * (1 + VAT.VATbyDate(this.date));
      // Round to 3 digits, Javascript sucks
      return parseFloat(vatPrice.toFixed(3));
    } else {
      console.log('Fuel lacks more taxes than just VAT, avoiding adding it');
      return NaN;
    }
  }

  /**
   * JSON stringify the entry
   *
   * @returns JSON representation of the fuel entry
   */
  public serialize(): string {
    return JSON.stringify(this);
  }

  /**
   * Recordize an instance.
   *
   * @returns Record<string, unknown> of the entry
   */
  public recordize(): Usable {
    return {
      date: this.date.toString(),
      category: this.category,
      notes: this.notes,
      fuel: this.fuel,
      elpePrice: this.elpePrice,
      motoroilPrice: this.motoroilPrice,
      unit: this.unit,
      meanPrice: this.meanPrice,
      vatPrice: this.vatPrice,
    };
  }

  /**
   * Unserialize a previously serialized entry
   *
   * @param s - String. The stringified serialized entry
   * @returns A FuelEntry instance
   */
  public static deserialize(s: string): FuelEntry {
    const datum = JSON.parse(s);
    if (validate_fuel(datum)) {
      return new FuelEntry(
        datum.date,
        datum.category,
        datum.notes,
        datum.fuel,
        datum.elpePrice,
        datum.motoroilPrice
      );
    } else {
      console.log(validate_fuel.errors);
      throw TypeError('Failed to validate');
    }
  }
}