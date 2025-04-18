import * as React from 'react';
import {EmbeddedCase, GetApplicationsFromEmbeddedData} from "./uscis.ts";
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


export function Root() {
    let applications = GetApplicationsFromEmbeddedData();

    return (
        <>
            <h2 id="your-cases" className="with-margin-bottom-md with-margin-top-2xl section-title">
                Raw Data (JSON)
            </h2>
            <ApplicationOverviewCard applications={applications}/>
            {applications.map(application => (
                <ApplicationJsonCard application={application}/>
            ))}
        </>
    )
}

export function ApplicationOverviewCard({applications}: { applications: EmbeddedCase[] }): JSX.Element {
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
                <h4>Notices</h4>
                <ApplicationNoticesTable applications={applications}/>

                <p/>
                <h4>Events</h4>
                <ApplicationEventsTable applications={applications}/>


            </AccordionDetails>
        </Accordion>
    );
}

export function ApplicationNoticesTable({applications}: { applications: EmbeddedCase[] }): JSX.Element {
    let notices = applications.flatMap(application => {
        return application.notices.map(notice => ({"application": application, "notice": notice}))
    }).sort((a, b) => {
        let aTime = Date.parse(a.notice.generationDate)
        let bTime = Date.parse(b.notice.generationDate)

        return aTime - bTime;
    });


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


export function ApplicationEventsTable({applications}: { applications: EmbeddedCase[] }): JSX.Element {
    let events = applications.flatMap(application => {
        return application.events.map(event => ({"application": application, "event": event}));
    }).sort((a, b) => {
        let aTime = Date.parse(a.event.eventTimestamp)
        let bTime = Date.parse(b.event.eventTimestamp)

        return aTime - bTime;
    });

    let eventDescription = (code: string) => {
        switch (code) {
            case "IAF":
                return "RECEIPT LETTER EMAILED"
            case "IMAG":
                return "BIOMETRICS APPOINTMENT NOTICE SENT"
            case "FTA0":
                return "DATABASE CHECKS RECEIVED"
            default:
                return ""
        }
    };

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
                            <TableCell align="left">{eventDescription(row.event.eventCode)}</TableCell>
                            <TableCell
                                align="right">{FormatTime(Temporal.Instant.from(row.event.eventTimestamp))}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export function ApplicationJsonCard({application}: { application: EmbeddedCase }): JSX.Element {
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