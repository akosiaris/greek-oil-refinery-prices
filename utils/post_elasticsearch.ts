// Posts a fuels.csv file to an elasticsearch cluster

import { readJSON } from "https://deno.land/x/flat/mod.ts";

try {
    const inputfile: string = Deno.args[0];
    const elasticsearch_url: string = Deno.args[1];
    const elasticsearch_username: string = Deno.args[2];
    const elasticsearch_password: string = Deno.args[3];
    const b64 = btoa(elasticsearch_username + ':' + elasticsearch_password);

    const data = await readJSON(inputfile);
    for (const datum of data) {
        const response = await fetch(
            elasticsearch_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + b64,
            },
            body: JSON.stringify(datum),
        });
        if (response.status != 201) {
            //POST failed, log why
            console.log(response);
        }
    }
} catch (error) {
    console.log(error);
}