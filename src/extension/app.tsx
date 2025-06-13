import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import * as USCIS from "../uscis/uscis.ts";
import {JSX} from "react";
import * as React from "react";
import {ApplicationJsonCard, ApplicationOverviewCard, TimelineOverviewCard} from "../uscis/components.tsx";
import {EmbeddedCase, findCases} from "../uscis/uscis.ts";

export function Root(queryClient: QueryClient, uscisClient: USCIS.Client): JSX.Element {
    let applications = getApplicationsFromEmbeddedData();

    return (
        <QueryClientProvider client={queryClient}>
            <h2 id="your-cases" className="with-margin-bottom-md with-margin-top-2xl section-title">
                Raw Data (JSON)
            </h2>
            <TimelineOverviewCard applications={applications}/>
            <ApplicationOverviewCard client={uscisClient} applications={applications}/>
            {applications.map(application => (
                <ApplicationJsonCard application={application}/>
            ))}
        </QueryClientProvider>
    )
}

function getApplicationsFromEmbeddedData(): EmbeddedCase[] {
    let dataElement = document.querySelector("script[data-component-name='CaseCardsApp']")
    let result: { cases: EmbeddedCase[] } = JSON.parse(dataElement.textContent);
    return findCases(result)
}