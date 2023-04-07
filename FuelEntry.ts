export class FuelEntry {
    // naive (not timezeone aware) date
    public date: Date;
    // Category of product, e.g. "Βενζινες"
    public category: FuelCategory;
    public notes: Notes;
    // name of product, e.g. "DIΕSEL AUTO BIO"
    public fuel: FuelName;
    // Prices for the 2 large oil distilleries
    public elpePrice: number;
    public motoroilPrice: number;
    public meanPrice: number;
  
    public constructor(date: Date, category: FuelCategory, notes: Notes, fuel: FuelName, elpePrice: number, motoroilPrice: number) {
      this.date = date;
      this.category = category;
      this.notes = notes;
      this.fuel = fuel;
      this.elpePrice = elpePrice;
      this.motoroilPrice = motoroilPrice;
    
      if (elpePrice && motoroilPrice) {
        this.meanPrice = (elpePrice + motoroilPrice) / 2;
      } else if (elpePrice) {
        this.meanPrice = elpePrice;
      } else if (motoroilPrice) {
        this.meanPrice = motoroilPrice;
      } else {
        this.meanPrice = NaN;
      }
    }
}
export default FuelEntry;