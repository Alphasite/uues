import * as React from 'react';
import { createRoot } from 'react-dom/client';

import {GetApplicationsFromEmbeddedData, Client} from "./uscis.ts";
import {Root} from "./components.tsx";
import {QueryClient} from "@tanstack/react-query";


function addRootElement(): Element {
    let casesElement = document.getElementById("your-cases").parentElement;

    let jsonCardElement = document.getElementById("uscis-json-card");
    if (jsonCardElement !== null) {
        return jsonCardElement;
    }

    let newAppElement = document.createElement("div");
    newAppElement.id = "uscis-json-card"

    casesElement.parentElement.insertBefore(newAppElement, casesElement)

    return newAppElement;
}

const queryClient = new QueryClient();
const uscisClient = new Client();

let applications = GetApplicationsFromEmbeddedData();
console.log(applications);

let app = addRootElement();
let root = createRoot(app);
root.render(Root(queryClient, uscisClient));
