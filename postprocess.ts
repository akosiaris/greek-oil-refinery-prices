import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';
import { readTXT, readJSON, writeJSON } from 'https://deno.land/x/flat/mod.ts';


try {
  const filename:string = Deno.args[0]
  const html:string = await readTXT(filename);
  const document:any = new DOMParser().parseFromString(html, 'text/html');

  const tbody:any = document.querySelector('tbody');

  const daysRegExp:RegExp = /(Δευτέρα|Τρίτη|Τετάρτη|Πέμπτη|Παρασκευή|Σάββατο|Κυριακή)/;
  const fuelCategoriesRegExp:RegExp = /(Βενζίνες|Πετρέλαια|Υγραέρια|ΜΑΖΟΥΤ-FUEL OIL|ΚΗΡΟΖΙΝΗ|ΑΣΦΑΛΤΟΣ)/;
  const ignoreRegExp:RegExp = /ΕΛ.ΠΕ.|Motor Oil|EX-FACTORY/;

  var date:string = null;
  var category:string = null;
  var data:[object] = new Array();
 
  var i:number;
  for (i=0; i < tbody.children.length; i++) {
	  if (daysRegExp.test(tbody.children[i].textContent)) {
		  date = tbody.children[i].textContent;
	  } else if (fuelCategoriesRegExp.test(tbody.children[i].textContent)) {
		  category = tbody.children[i].textContent.match(fuelCategoriesRegExp)[0];
	  } else if (ignoreRegExp.test(tbody.children[i].textContent)) {
		  // do nothing, we don't care
	  } else {
 	  // Here we go, we are parsing actual prices now
		  var tds = tbody.children[i].children;
		  var fuelName:string = tds[0].textContent;
		  var elpePrice:number = parseFloat(tds[1].textContent.replace(/\./, '').replace(/,/, '.'));
		  var motoroilPrice:number = parseFloat(tds[2].textContent.replace(/\./, '').replace(/,/, '.'));
		  // And let's create the object
		  var datum = {
			  date: date.trim(),
			  category: category.trim(),
			  fuelName: fuelName.trim(),
			  elpePrice: elpePrice,
			  motoroilPrice: motoroilPrice,
		  };
		  data.push(datum);
	  }
  }

  var jsondata  = await readJSON('data.json');
  jsondata.push(data);
  await writeJSON('data.json', jsondata, null, 2);
} catch(error) {
  console.log(error);
}
