import * as React from 'react';
import { createRoot } from 'react-dom/client';

import {GetApplicationsFromEmbeddedData} from "./uscis.ts";
import {Root} from "./components.tsx";


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

let applications = GetApplicationsFromEmbeddedData();
console.log(applications);

let app = addRootElement();
let root = createRoot(app);
root.render(Root());
