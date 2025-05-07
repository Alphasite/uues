import {
    QueryClient,
    QueryClientProvider,
    useQuery,
} from '@tanstack/react-query'
import * as React from 'react';
import * as USCIS from "./uscis.ts";
import {JSX} from "react";

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {Paper} from "@mui/material";
import {Temporal} from "temporal-polyfill";

export function Root(queryClient: QueryClient, uscisClient: USCIS.Client) {
    let applications = USCIS.GetApplicationsFromEmbeddedData();

    return (
        <QueryClientProvider client={queryClient}>
            <h2 id="your-cases" className="with-margin-bottom-md with-margin-top-2xl section-title">
                Raw Data (JSON)
            </h2>
            <ApplicationOverviewCard client={uscisClient} applications={applications}/>
            {applications.map(application => (
                <ApplicationJsonCard application={application}/>
            ))}
        </QueryClientProvider>
    )
}

export function ApplicationOverviewCard({client, applications}: {
    client: USCIS.Client,
    applications: USCIS.EmbeddedCase[]
}): JSX.Element {
    let userActionNeeded = applications
        .map(application => application.actionRequired)
        .reduce((previousValue, actionRequired) => actionRequired || previousValue);

    return (
        <Accordion defaultExpanded>
            <AccordionSummary
                expandIcon={<ArrowDownwardIcon/>}
                aria-controls="panel1-content"
                id="panel1-header"
            >
                <Typography component="span">Overview</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <p>Action Required: {`${userActionNeeded}`}</p>

                <p/>
                <h4>Cases</h4>
                <ApplicationTable applications={applications}/>

                <p/>
                <h4>Documents</h4>
                <ApplicationDocumentsTable client={client} applications={applications}/>


                <p/>
                <h4>Notices</h4>
                <ApplicationNoticesTable applications={applications}/>

                <p/>
                <h4>Events</h4>
                <ApplicationEventsTable applications={applications}/>

            </AccordionDetails>
        </Accordion>
    );
}

export function ApplicationTable({applications}: { applications: USCIS.EmbeddedCase[] }): JSX.Element {
    let applications_ = applications.map(application => {
        let eventTimeStamps = application.events.map(
            event => Temporal.Instant.from(event.updatedAtTimestamp),
        )
        let noticeTimeStamps = application.notices.map(
            notice => Temporal.Instant.from(notice.generationDate),
        )

        let events = [
            ...eventTimeStamps,
            ...noticeTimeStamps,
            Temporal.Instant.from(application.updatedAtTimestamp || application.submissionTimestamp),
        ]
        let updatedAt = events.reduce((a, b) => {
            return a.epochMilliseconds > b.epochMilliseconds ? a : b
        });

        return {
            application: application,
            updated: updatedAt,
        };
    }).sort((a, b) => {
        let aTime = a.updated.epochMilliseconds
        let bTime = b.updated.epochMilliseconds

        return aTime - bTime;
    }).reverse();


    return (
        <TableContainer component={Paper}>
            <Table sx={{minWidth: 400}} aria-label="simple table">
                <TableHead>
                    <TableRow>
                        <TableCell>Case</TableCell>
                        <TableCell align="left">Type</TableCell>
                        <TableCell align="right">Closed</TableCell>
                        <TableCell align="right">Submitted</TableCell>
                        <TableCell align="right">Updated</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {applications_.map((row) => (
                        <TableRow
                            key={row.application.receiptNumber}
                            sx={{'&:last-child td, &:last-child th': {border: 0}}}
                        >
                            <TableCell component="th" scope="row">{row.application.receiptNumber}</TableCell>
                            <TableCell component="th" scope="row">{row.application.formType}</TableCell>
                            <TableCell align="left">{`${row.application.closed}`}</TableCell>
                            <TableCell align="right">{row.application.submissionDate}</TableCell>
                            <TableCell align="right">{FormatTime(row.updated)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}


export function ApplicationDocumentsTable({client, applications}: {
    client: USCIS.Client,
    applications: USCIS.EmbeddedCase[]
}): JSX.Element {
    const {isPending, error, data} = useQuery({
        queryKey: ['repoData'],
        queryFn: () => {
            let promises: Promise<{application: USCIS.EmbeddedCase, document: USCIS.Document}[]>[] = []
            for (let application of applications) {
                let promise = client.listDocuments(
                    application.receiptNumber,
                ).then(docs => {
                    return docs.data.map(doc => {
                        return {application: application, document: doc}
                    })
                });
                promises.push(promise);
            }

            return Promise.all(promises)
        },
    })

    if (isPending) {
        return (
            <p>'Loading documents'</p>
        )
    }

    if (error) {
        return (
            <p>'Failed to load documents: \{error.message}'</p>
        )
    }

    let documents = data.flat().filter(doc => {
        return doc.document.sourceType == "USCIS Generated"
    }).sort((a, b) => {
        let aTime = Date.parse(a.document.createDate)
        let bTime = Date.parse(b.document.createDate)

        return aTime - bTime;
    }).reverse();


    return (
        <TableContainer component={Paper}>
            <Table sx={{minWidth: 400}} aria-label="simple table">
                <TableHead>
                    <TableRow>
                        <TableCell>Case</TableCell>
                        <TableCell align="left">Type</TableCell>
                        <TableCell align="right">Name</TableCell>
                        <TableCell align="right">Created At</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {documents.map((row) => (
                        <TableRow
                            key={row.document.contentId}
                            sx={{'&:last-child td, &:last-child th': {border: 0}}}
                        >
                            <TableCell component="th" scope="row">
                                {row.application.formType}
                            </TableCell>
                            <TableCell align="left">{row.document.type}</TableCell>
                            <TableCell align="left">{row.document.fileName}</TableCell>
                            <TableCell align="right">
                                {FormatTime(Temporal.Instant.from(row.document.createDate))}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}


export function ApplicationNoticesTable({applications}: { applications: USCIS.EmbeddedCase[] }): JSX.Element {
    let notices = applications.flatMap(application => {
        return application.notices.map(notice => ({"application": application, "notice": notice}))
    }).sort((a, b) => {
        let aTime = Date.parse(a.notice.generationDate)
        let bTime = Date.parse(b.notice.generationDate)

        return aTime - bTime;
    }).reverse();

    return (
        <TableContainer component={Paper}>
            <Table sx={{minWidth: 400}} aria-label="simple table">
                <TableHead>
                    <TableRow>
                        <TableCell>Case</TableCell>
                        <TableCell align="left">Type</TableCell>
                        <TableCell align="right">Scheduled At</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {notices.map((row) => (
                        <TableRow
                            // key={row.event.eventId}
                            sx={{'&:last-child td, &:last-child th': {border: 0}}}
                        >
                            <TableCell component="th" scope="row">
                                {row.application.formType}
                            </TableCell>
                            <TableCell align="left">{row.notice.actionType}</TableCell>
                            <TableCell align="right">
                                {FormatTime(Temporal.Instant.from(row.notice.appointmentDateTime))}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}


export function ApplicationEventsTable({applications}: { applications: USCIS.EmbeddedCase[] }): JSX.Element {
    let events = applications.flatMap(application => {
        return application.events.map(event => ({"application": application, "event": event}));
    }).sort((a, b) => {
        let aTime = Date.parse(a.event.eventTimestamp)
        let bTime = Date.parse(b.event.eventTimestamp)

        return aTime - bTime;
    }).reverse();

    return (
        <TableContainer component={Paper}>
            <Table sx={{minWidth: 400}} aria-label="simple table">
                <TableHead>
                    <TableRow>
                        <TableCell>Case</TableCell>
                        <TableCell align="left">Kind</TableCell>
                        <TableCell align="left">Detail</TableCell>
                        <TableCell align="right">Created</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {events.map((row) => (
                        <TableRow
                            // key={row.event.eventId}
                            sx={{'&:last-child td, &:last-child th': {border: 0}}}
                        >
                            <TableCell component="th" scope="row">
                                {row.application.formType}
                            </TableCell>
                            <TableCell align="left">{row.event.eventCode}</TableCell>
                            <TableCell align="left">{USCIS.EventCodes[row.event.eventCode] || ""}</TableCell>
                            <TableCell align="right">
                                {FormatTime(Temporal.Instant.from(row.event.eventTimestamp))}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export function ApplicationJsonCard({application}: { application: USCIS.EmbeddedCase }): JSX.Element {
    let applicationCopy = DeepCopy(application) as any;
    applicationCopy.concurrentCases = applicationCopy.concurrentCases.map(application => application.receiptNumber)

    return (
        <Accordion>
            <AccordionSummary
                expandIcon={<ArrowDownwardIcon/>}
                aria-controls="panel1-content"
                id="panel1-header"
            >
                <Typography component="span">Case: {application.formType}: {application.receiptNumber}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <pre>
                    {JSON.stringify(applicationCopy, null, 2)}
                </pre>
            </AccordionDetails>
        </Accordion>
    );
}

function DeepCopy<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}


function FormatTime(date: Temporal.Instant): string {
    return date.toLocaleString('en-CA')
}