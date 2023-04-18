// Used for VAT calculation
const volumeRegExp: RegExp = /τιμές σε €\/m3/;
const massRegExp: RegExp = /τιμές σε €\/μ.τ./;
const missingOnlyVATRegExp: RegExp = /συμπεριλ. φόρων – τελών, προ ΦΠΑ/;

// Type to limit the values for fuel categories. String otherwise
type FuelCategory = 'Βενζίνες' | 'Πετρέλαια' | 'Υγραέρια – LPG' | 'ΜΑΖΟΥΤ-FUEL OIL' | 'ΚΗΡΟΖΙΝΗ – KERO' | 'ΑΣΦΑΛΤΟΣ';
// Type to limit the values for fuel names. String otherwise
type FuelName = 'DIΕSEL AUTO BIO' | 'Fuel Oil No 180 1%S' | 'Fuel Oil No 380 1%S' | 'HEATING GASOIL' | 'HEATING GASOIL (Χ.Π)' | 'HEATING GASOIL (ΧΠ)' | 'KERO' | 'KERO SPECIAL' | 'LPG AUTO' | 'LPG ΒΙΟΜΗΧΑΝΙΑΣ' | 'LPG ΘΕΡΜΑΝΣΗΣ' | 'UNLEADED 100' | 'UNLEADED 100 BIO' | 'UNLEADED 95' | 'UNLEADED 95 BIO' | 'UNLEADED LRP' | 'UNLEADED LRP BIO' | 'ΒΕΑ 30/45' | 'ΒΕΑ 35/40' | 'ΒΕΑ 50/70 & 70/100' | 'ΒΕΘ 50/70' | 'ΒΟΥΤΑΝΙΟ ΒΙΟΜΗΧΑΝΙΑΣ' | 'ΠΡΟΠΑΝΙΟ ΒΙΟΜΗΧΑΝΙΑΣ';
// Type to limit the values for notes. Interestingly they are rather well structured
type Notes = 'τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ' | 'τιμές σε €/μ.τ., προ φόρων – τελών και ΦΠΑ' | 'τιμές σε €/μ.τ., συμπεριλ. φόρων – τελών, προ ΦΠΑ';
// Is this fuel counted in mass? or volume ?
type Unit = 'Κυβικό Μέτρο' | 'Μετρικός Τόνος';

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
  public meanPrice!: number;
  public vat24Price!: number;
  public vat17Price!: number; // 'Ισχύει μόνο για Λέρο, Λέσβο, Κω, Σάμο και Χίο';
  public unit!: Unit;

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
  public constructor(date: Date, category: string, notes: string, fuel: string, elpePrice: number, motoroilPrice: number) {
    this.date = date;
    this.category = category as FuelCategory;
    this.notes = notes as Notes;
    this.fuel = fuel as FuelName;
    this.elpePrice = elpePrice;
    this.motoroilPrice = motoroilPrice;

    this.setUnit();
    this.addMeanPrice();
    this.addVAT();
  }

  /**
   * Calcuates the mean price of ΕΛ.ΠΕ. and MotorOil
   */
  private addMeanPrice(): void {
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
    this.meanPrice = parseFloat(meanPrice.toFixed(3));
  }

  /**
   * Calculates and set the unit property based on the notes
   */
  private setUnit(): void {
    if (volumeRegExp.test(this.notes)) {
      this.unit = 'Κυβικό Μέτρο';
    } else if (massRegExp.test(this.notes))  {
      this.unit = 'Μετρικός Τόνος';
    }
  }

  /**
   * Adds 24% VAT and 17% VAT properties. Only some fuel types will have that added
   */
  private addVAT(): void {
    if (missingOnlyVATRegExp.test(this.notes)) {
      let vat24Price: number = this.meanPrice * 1.24;
      let vat17Price: number = this.meanPrice * 1.17;
      // Round to 3 digits, Javascript sucks
      this.vat24Price = parseFloat(vat24Price.toFixed(3));
      this.vat17Price = parseFloat(vat17Price.toFixed(3));
    } else {
      console.log('Fuel lacks more taxes than just VAT, avoiding adding it');
    }
  }
}