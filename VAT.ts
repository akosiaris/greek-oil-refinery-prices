export class VAT { 
    public start: Date
    public end: Date
    public value: number

    public constructor(start: Date, end: Date, value: number) {
        this.start = start;
        this.end = end;
        this.value = value;
    }

    public static VATbyDate(date: Date): number {
        if (date > VAT_18_PERCENT.start && date < VAT_18_PERCENT.end) {
            return VAT_18_PERCENT.value;
        } else if (date > VAT_19_PERCENT.start && date < VAT_19_PERCENT.end) {
            return VAT_19_PERCENT.value;
        } else if (date > VAT_21_PERCENT.start && date < VAT_21_PERCENT.end) {
            return VAT_21_PERCENT.value;
        } else if (date > VAT_23_PERCENT.start && date < VAT_23_PERCENT.end) {
            return VAT_23_PERCENT.value;
        } else if (date > VAT_24_PERCENT.start && date < VAT_24_PERCENT.end) {
            return VAT_24_PERCENT.value;
        } else {
            return NaN;
        }
    }
}

const VAT_18_PERCENT = new VAT(
    new Date('2003-07-01'), // Ν. 3193/2003, ΦΕΚ Α 266/20.11.2003
    new Date('2005-04-19'), // Ν. 3336/2005, ΦΕΚ Α 96/20-04-2005)
    0.18,
);

const VAT_19_PERCENT = new VAT(
    new Date('2005-04-20'), // Ν. 3336/2005, ΦΕΚ Α 96/20-04-2005)
    new Date('2010-03-14'), // Ν. 3833/2010, ΦΕΚ Α 40/15-03-2010 
    0.19,
);

const VAT_21_PERCENT = new VAT(
    new Date('2010-03-15'), // Ν. 3833/2010, ΦΕΚ Α 40/15-03-2010 
    new Date('2010-06-30'), // N. 3845/2010, ΦΕΚ Α 65/06-05-2010
    0.21,
);

const VAT_23_PERCENT = new VAT(
    new Date('2010-07-01'), // N. 3845/2010. ΦΕΚ Α 65/06-05-2010
    new Date('2016-05-31'), // Ν. 4389/2016, ΦΕΚ Α 94/27-05-2016
    0.23
);

const VAT_24_PERCENT = new VAT(
    new Date('2016-06-01'), // Ν. 4389/2016, ΦΕΚ Α 94/27-05-2016
    new Date('9999-12-01'), // Για να δούμε πότε θα το αλλάξω αυτό
    0.24
);