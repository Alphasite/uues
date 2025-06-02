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
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import GroupsIcon from '@mui/icons-material/Groups';
import VerifiedIcon from '@mui/icons-material/Verified';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import {Paper} from "@mui/material";
import {Temporal} from "temporal-polyfill";

export function Root(queryClient: QueryClient, uscisClient: USCIS.Client) {
    let applications = USCIS.GetApplicationsFromEmbeddedData();

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

export function TimelineOverviewCard({applications}: {
    applications: USCIS.EmbeddedCase[]
}): JSX.Element {
    return (
        <Accordion>
            <AccordionSummary
                expandIcon={<ArrowDownwardIcon/>}
                aria-controls="panel1-content"
                id="panel1-header"
            >
                <Typography component="span">Timeline</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <ApplicationTimeline applications={applications}/>
            </AccordionDetails>
        </Accordion>
    );
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
                        <TableCell align="right">Action Required</TableCell>
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
                            <TableCell align="left">{`${row.application.actionRequired}`}</TableCell>
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
            let promises: Promise<{ application: USCIS.EmbeddedCase, document: USCIS.Document }[]>[] = []
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
        let aTime = Date.parse(a.event.createdAtTimestamp)
        let bTime = Date.parse(b.event.createdAtTimestamp)

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
                                {FormatTime(Temporal.Instant.from(row.event.createdAtTimestamp))}
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
                    {JSON.stringify(applicationCopy, null, 4)}
                </pre>
            </AccordionDetails>
        </Accordion>
    );
}

export function ApplicationTimeline({applications}: { applications: USCIS.EmbeddedCase[] }): JSX.Element {
    type TimelineEvent = {
        timestamp: Temporal.Instant,
        title: string | null,
        description: string | null,
        textColour: string,
        dotColour: string,
        application: USCIS.EmbeddedCase,
        important: boolean,
        icon: JSX.Element | null,
    }

    var timeline: TimelineEvent[] = []

    let startIcon = (<FlagOutlinedIcon/>)
    let fingerprintIcon = (<FingerprintIcon/>)
    let interviewIcon = (<GroupsIcon/>)
    let approvalIcon = (<VerifiedIcon/>)
    let mailIcon = (<MailOutlinedIcon/>)

    applications.map((application: USCIS.EmbeddedCase) => {
        for (let event of application.events) {
            let timelineEvent: TimelineEvent = {
                timestamp: Temporal.Instant.from(event.createdAtTimestamp),
                title: null,
                description: `${application.formType}: ${event.eventCode}: ${USCIS.EventCodes[event.eventCode] || "Unknown"}`,
                textColour: "text.grey",
                dotColour: "grey",
                application: application,
                important: false,
                icon: null,
            }

            switch (event.eventCode) {
                case "LDA":
                    timelineEvent.title = `${application.formType}: Mailed`
                    timelineEvent.description = `${event.eventCode}: ${USCIS.EventCodes[event.eventCode] || "Unknown"}`
                    timelineEvent.icon = mailIcon
                    timelineEvent.important = true
                    break

                case "SA":
                case "H008":
                    timelineEvent.title = `${application.formType}: Approved`
                    timelineEvent.description = `${event.eventCode}: ${USCIS.EventCodes[event.eventCode] || "Unknown"}`
                    timelineEvent.icon = approvalIcon
                    timelineEvent.dotColour = "success"
                    timelineEvent.important = true
                    break
            }

            timeline.push(timelineEvent)
        }

        for (let notice of application.notices) {
            let timelineEvent: TimelineEvent = {
                timestamp: Temporal.Instant.from(notice.appointmentDateTime),
                title: `${application.formType}: ${notice.actionType}`,
                description: null,
                textColour: "text.primary",
                dotColour: "primary",
                application: application,
                important: true,
                icon: null,
            }

            switch (notice.actionType) {
                case "Interview Scheduled":
                    timelineEvent.title = `${application.formType}: Interview`
                    timelineEvent.description = notice.actionType
                    timelineEvent.icon = interviewIcon
                    break
                case "Appointment Scheduled":
                    timelineEvent.title = `${application.formType}: Biometrics`
                    timelineEvent.description = notice.actionType
                    timelineEvent.icon = fingerprintIcon
            }

            timeline.push(timelineEvent)
        }

        // for (let document of application.documents) {
        //     timeline.push({
        //         timestamp: Temporal.Instant.from(document),
        //         title: notice.actionType,
        //         colour: "",
        //         application: application
        //     })
        // }
    })

    timeline.sort((a, b) => {
        return a.timestamp.epochMilliseconds - b.timestamp.epochMilliseconds
    })

    let locale = Intl.DateTimeFormat(undefined).resolvedOptions().timeZone
    let submissionTime = Temporal.Instant.from(timeline[0].application.submissionTimestamp).toZonedDateTimeISO(locale)
    return (
        <Timeline position="left">
            <TimelineItem>
                <TimelineOppositeContent
                    sx={{ m: 'auto 0' }}
                    variant="body2"
                    color="text.secondary"
                >
                    <Typography variant="h6" component="span">
                        {submissionTime.toString().substring(0, 10)}
                    </Typography>
                    <Typography>
                        0 days
                    </Typography>
                </TimelineOppositeContent>
                <TimelineSeparator>
                    <TimelineDot color="success" variant="filled">
                        {startIcon}
                    </TimelineDot>
                    <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent sx={{ py: '12px', px: 2 }} color="primary">
                    <Typography variant="h6" component="span">
                        Initial Submission
                    </Typography>
                </TimelineContent>
            </TimelineItem>
            {timeline.map(e => {
                let instant = e.timestamp.toZonedDateTimeISO(locale)
                let submissionDate = Temporal.Instant.from(e.application.submissionTimestamp)
                let timeSinceSubmission = e.timestamp.since(submissionDate).round("days")
                return (
                    <TimelineItem>
                        <TimelineOppositeContent
                            sx={{ m: 'auto 0' }}
                            variant="body2"
                            color="text.secondary"
                        >
                            <Typography variant="h6" component="span">
                                {instant.toString().substring(0, 10)}
                            </Typography>
                            <Typography>
                                {timeSinceSubmission.days} days
                            </Typography>
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                            <TimelineConnector />
                            <TimelineDot color={e.dotColour} variant={e.important ? "filled" : "outlined"}>
                                {e.icon}
                            </TimelineDot>
                            <TimelineConnector />
                        </TimelineSeparator>
                        <TimelineContent sx={{ py: '12px', px: 2 }} color={e.textColour}>
                            <Typography variant="h6" component="span">
                                {e.title ? e.title : ""}
                            </Typography>
                            <Typography variant="subtitle2">
                                {e.description}
                            </Typography>
                        </TimelineContent>
                    </TimelineItem>
                )
            })}
        </Timeline>
    )
}

function DeepCopy<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}


function FormatTime(date: Temporal.Instant): string {
    return date.toLocaleString('en-CA')
}