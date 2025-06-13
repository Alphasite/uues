import { createRoot } from 'react-dom/client';

import * as App from './app.tsx';
import {Client} from "../uscis/uscis.ts";
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

let rootElement = addRootElement();
let root = createRoot(rootElement);
root.render(App.Root(queryClient, uscisClient));
