import { FuelEntry } from "./FuelEntry.ts";
import { parseISO } from "../deps.ts";

const categories: Record<string, { id: number; name: string; notes: string }> = {
  "1": {
    id: 1,
    name: "Βενζίνες",
    notes: "τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ"
  },
  "2": {
    id: 2,
    name: "Πετρέλαια",
    notes: "τιμές σε €/m3, συμπεριλ. φόρων – τελών, προ ΦΠΑ"
  },
  "3": {
    id: 3,
    name: "Υγραέρια – LPG",
    notes: "τιμές σε €/μ.τ., συμπεριλ. φόρων – τελών, προ ΦΠΑ"
  },
  "4": {
    id: 4,
    name: "ΜΑΖΟΥΤ-FUEL OIL",
    notes: "τιμές σε €/μ.τ., συμπεριλ. φόρων – τελών, προ ΦΠΑ"
  },
  "5": {
    id: 5,
    name: "ΚΗΡΟΖΙΝΗ – KERO",
    notes: "τιμές σε €/μ.τ., προ φόρων – τελών και ΦΠΑ"
  },
  "6": {
    id: 6,
    name: "ΑΣΦΑΛΤΟΣ",
    notes: "τιμές σε €/μ.τ., προ φόρων – τελών και ΦΠΑ"
  }
}
const fuels: Record<string, { id: number; iD_ProductCategory: number; productCategoryName: string; order: number; name: string; notes: string | null; createdBy: string; createdOn: string }> = {
  "1": {
    id: 1,
    iD_ProductCategory: 1,
    productCategoryName: "Βενζίνες",
    order: 1,
    name: "UNLEADED LRP BIO",
    notes: null,
    createdBy: "vkassios",
    createdOn: "2025-11-03T16:04:01.29"
  },
  "2": {
    id: 2,
    iD_ProductCategory: 1,
    productCategoryName: "Βενζίνες",
    order: 2,
    name: "UNLEADED 95 BIO",
    notes: null,
    createdBy: "vkassios",
    createdOn: "2025-11-03T16:04:12.09"
  },
  "3": {
    id: 3,
    iD_ProductCategory: 1,
    productCategoryName: "Βενζίνες",
    order: 3,
    name: "UNLEADED 100 BIO",
    notes: null,
    createdBy: "vkassios",
    createdOn: "2025-11-03T16:04:23.5"
  },
  "4": {
    id: 4,
    iD_ProductCategory: 2,
    productCategoryName: "Πετρέλαια",
    order: 1,
    name: "DIΕSEL AUTO BIO",
    notes: null,
    createdBy: "vkassios",
    createdOn: "2025-11-03T16:04:42.14"
  },
  "5": {
    id: 5,
    iD_ProductCategory: 2,
    productCategoryName: "Πετρέλαια",
    order: 2,
    name: "HEATING GASOIL (ΧΠ)",
    notes: null,
    createdBy: "vkassios",
    createdOn: "2025-11-03T16:04:56.0666667"
  },
  "6": {
    id: 6,
    iD_ProductCategory: 3,
    productCategoryName: "Υγραέρια – LPG",
    order: 1,
    name: "LPG AUTO",
    notes: null,
    createdBy: "vkassios",
    createdOn: "2025-11-03T16:05:13.0633333"
  },
  "7": {
    id: 7,
    iD_ProductCategory: 3,
    productCategoryName: "Υγραέρια – LPG",
    order: 2,
    name: "LPG ΘΕΡΜΑΝΣΗΣ",
    notes: null,
    createdBy: "vkassios",
    createdOn: "2025-11-03T16:05:28.22"
  },
  "8": {
    id: 8,
    iD_ProductCategory: 3,
    productCategoryName: "Υγραέρια – LPG",
    order: 3,
    name: "LPG ΒΙΟΜΗΧΑΝΙΑΣ",
    notes: null,
    createdBy: "vkassios",
    createdOn: "2025-11-03T16:05:41.8366667"
  },
  "9": {
    id: 9,
    iD_ProductCategory: 3,
    productCategoryName: "Υγραέρια – LPG",
    order: 4,
    name: "ΠΡΟΠΑΝΙΟ ΒΙΟΜΗΧΑΝΙΑΣ",
    notes: null,
    createdBy: "vkassios",
    createdOn: "2025-11-03T16:06:00.5766667"
  },
  "10": {
    id: 10,
    iD_ProductCategory: 3,
    productCategoryName: "Υγραέρια – LPG",
    order: 5,
    name: "ΒΟΥΤΑΝΙΟ ΒΙΟΜΗΧΑΝΙΑΣ",
    notes: null,
    createdBy: "vkassios",
    createdOn: "2025-11-03T16:06:22.7966667"
  },
  "11": {
    id: 11,
    iD_ProductCategory: 4,
    productCategoryName: "ΜΑΖΟΥΤ-FUEL OIL",
    order: 1,
    name: "Fuel Oil No 180 1%S",
    notes: null,
    createdBy: "vkassios",
    createdOn: "2025-11-03T16:08:14.7233333"
  },
  "12": {
    id: 12,
    iD_ProductCategory: 4,
    productCategoryName: "ΜΑΖΟΥΤ-FUEL OIL",
    order: 2,
    name: "Fuel Oil No 380 1%S",
    notes: null,
    createdBy: "vkassios",
    createdOn: "2025-11-03T16:08:33.9733333"
  },
  "13": {
    id: 13,
    iD_ProductCategory: 5,
    productCategoryName: "ΚΗΡΟΖΙΝΗ – KERO",
    order: 1,
    name: "KERO",
    notes: null,
    createdBy: "vkassios",
    createdOn: "2025-11-03T16:08:45.9533333"
  },
  "14": {
    id: 14,
    iD_ProductCategory: 5,
    productCategoryName: "ΚΗΡΟΖΙΝΗ – KERO",
    order: 2,
    name: "KERO SPECIAL",
    notes: null,
    createdBy: "vkassios",
    createdOn: "2025-11-03T16:09:33.4966667"
  },
  "15": {
    id: 15,
    iD_ProductCategory: 6,
    productCategoryName: "ΑΣΦΑΛΤΟΣ",
    order: 1,
    name: "ΒΕΑ 50/70 & 70/100",
    notes: null,
    createdBy: "vkassios",
    createdOn: "2025-11-03T16:09:46.58"
  },
  "16": {
    id: 16,
    iD_ProductCategory: 6,
    productCategoryName: "ΑΣΦΑΛΤΟΣ",
    order: 2,
    name: "ΒΕΑ 30/45",
    notes: null,
    createdBy: "vkassios",
    createdOn: "2025-11-03T16:09:57.6366667"
  },
  "17": {
    id: 17,
    iD_ProductCategory: 6,
    productCategoryName: "ΑΣΦΑΛΤΟΣ",
    order: 3,
    name: "ΒΕΑ 35/40",
    notes: null,
    createdBy: "vkassios",
    createdOn: "2025-11-03T16:10:07.06"
  },
  "18": {
    id: 18,
    iD_ProductCategory: 6,
    productCategoryName: "ΑΣΦΑΛΤΟΣ",
    order: 4,
    name: "ΒΕΘ 50/70",
    notes: null,
    createdBy: "vkassios",
    createdOn: "2025-11-03T16:10:18.9366667"
  }
}

export function parse_api_posts(data: Record<string, Record<string, string|number>[]>): FuelEntry[] {
  const fuel_entries: FuelEntry[] = [];
  const raw_posts = data["posts"];
  /* Re-key posts by their ID for easier access */
  const posts: Record<string, Record<string, string|number>> = {};
  for (const post of raw_posts) {
    posts[post.id] = post;
  }
  //console.log(posts);
  const postDetails = data["postDetails"];

  for (const postDetail of postDetails) {
    const postId = postDetail["iD_Post"];
    // We need the postDate from the main post object, cause that's the reference day, not the createdOn date from postDetail
    const post = posts[postId];
    postDetail["postDate"] = post["postDate"];
    const date = parseISO(post["postDate"] as string, {})
    // And we need the category from the product
    const category = categories[fuels[postDetail["iD_Product"]]["iD_ProductCategory"]];
    postDetail["category"] = category["name"];
    postDetail["notes"] = category["notes"];
    let elpePrice: number = NaN;
    let motoroilPrice: number = NaN;
    if (postDetail["iD_Vendor"] == 1) {
      elpePrice = postDetail["value"] as number;
    } else if (postDetail["iD_Vendor"] == 2) {
      motoroilPrice = postDetail["value"] as number;
    }
    // I hate myself for doing this, but we need to merge entries from different vendors and we may have pushed one already
    const idx = fuel_entries.findIndex((element) => {
      if (!element) {
        return false;
      }
      return element.date.getTime() == date.getTime() &&
      element.category == postDetail["category"] &&
      element.fuel == postDetail["productName"];
    });
    if (idx != -1) {
      console.log("Merging entries for", postDetail["productName"], "on", date);
      elpePrice = elpePrice ? elpePrice : fuel_entries[idx].elpePrice;
      motoroilPrice = motoroilPrice ? motoroilPrice : fuel_entries[idx].motoroilPrice;
      delete fuel_entries[idx];
    }

    const fuel_entry = new FuelEntry(
      date,
      postDetail["category"] as string,
      postDetail["notes"] as string,
      postDetail["productName"] as string,
      elpePrice,
      motoroilPrice,
    );  
    fuel_entries.push(fuel_entry);
  }
  return fuel_entries.filter((n) => n); // Remove deleted entries
}