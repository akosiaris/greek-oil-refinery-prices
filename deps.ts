export {
    readJSON,
    writeJSON,
    readTXT,
    writeTXT
} from 'https://deno.land/x/flat@0.0.15/mod.ts';
export { JsonPatch } from 'https://deno.land/x/json_patch@v0.1.2/mod.ts';
export {
    DOMParser,
    HTMLDocument,
    Element,
    HTMLCollection
} from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';

export { default as parse } from 'https://deno.land/x/date_fns@v2.22.1/parse/index.js';
export { default as isValid } from 'https://deno.land/x/date_fns@v2.22.1/isValid/index.js';
export { default as intervalToDuration } from 'https://deno.land/x/date_fns@v2.22.1/intervalToDuration/index.ts';
export { el } from 'https://deno.land/x/date_fns@v2.22.1/locale/index.js';
export {parseFeed} from "https://deno.land/x/rss@1.0.0/mod.ts";