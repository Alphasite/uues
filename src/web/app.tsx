import * as USCIS from "../uscis/uscis.ts";
import * as Components from "../uscis/components.tsx";
import * as React from "react";
import {JSX} from "react";
import {Alert, Card, CardContent, CardMedia, Container, Skeleton, Stack, TextField} from "@mui/material";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";

export function Root({}: {}): JSX.Element {
    const [applications, setApplications] = React.useState([]);

    let elements: JSX.Element = <>
        <Skeleton variant="rectangular" height={50}/>
        <Skeleton variant="rectangular" height={150}/>
    </>
    if (applications.length > 0) {
        elements = (
            <>
                <Components.TimelineOverviewCard applications={applications}/>
                <Components.ApplicationOverviewCard client={null} applications={applications}/>
                {applications.map(application => (
                    <Components.ApplicationJsonCard application={application}/>
                ))}
            </>
        )
    }

    return (
        <Container maxWidth="lg">
            <Stack spacing={2} sx={{boxShadow: 0, border: 0}}>
                <Typography variant="h5" gutterBottom>
                    Raw Data (JSON)
                </Typography>

                <Accordion>
                    <AccordionSummary>
                        <Typography component="span"> Help! How do i use this thing?</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <HowTo></HowTo>
                    </AccordionDetails>
                </Accordion>

                <ApplicationEntry setApplications={setApplications}/>
                {elements}
            </Stack>
        </Container>
    );
}

export function ApplicationEntry({setApplications}: {
    setApplications: (application: USCIS.EmbeddedCase[]) => void
}): JSX.Element {
    const [error, setError] = React.useState("");

    let errElement: JSX.Element = <></>
    if (error !== "") {
        errElement = <Alert severity="error">{error}</Alert>
    }

    return (
        <>
            {errElement}
            <TextField
                id="outlined-multiline-static"
                label="Enter JSON Here"
                multiline
                fullWidth={true}
                rows={8}
                defaultValue=""
                onChange={(event) => {
                    try {
                        let parsedInput = JSON.parse(event.target.value)
                        let applications = USCIS.findCases(parsedInput)

                        let errors: string[] = []
                        let requiredFields = ["receiptNumber", "formType", "submissionDate", "submissionTimestamp", "events", "notices"]
                        for (let application of applications) {
                            for (let requiredField of requiredFields) {
                                if (application[requiredField] === undefined) {
                                    errors.push(`missing field "${requiredField}"`)
                                }
                            }
                        }
                        console.log(applications)
                        if (errors.length > 0) {
                            setError(`Invalid JSON: ${errors.join("; ")}`)
                            return
                        }

                        setApplications(applications);
                        setError("")
                    } catch (e) {
                        setError(e.message)
                    }
                }}
            />
        </>
    );
}

function HowTo(): JSX.Element {
    return (
        <>
            <Stack spacing={2}>
                <Typography variant="body2">
                    This is a tool to help you view the raw data from the USCIS website.
                </Typography>

                <Card sx={{ maxWidth: 750 }}>
                    <CardMedia
                        component="img"
                        alt="login"
                        image="/assets/help-0-login.png"
                    />
                    <CardContent>
                        <Typography gutterBottom variant="h5" component="div">
                            1. Login
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Go to the <a href="https://my.uscis.gov/account/applicant">USCIS website</a> and login.
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ maxWidth: 750 }}>
                    <CardMedia
                        component="img"
                        alt="web inspector"
                        image="/assets/help-1-web-inspector.png"
                    />
                    <CardContent>
                        <Typography gutterBottom variant="h5" component="div">
                            2. Open the web inspector
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Open up the web inspector (F12) and go to the "Inspector" tab.
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ maxWidth: 750 }}>
                    <CardMedia
                        component="img"
                        alt="find json"
                        image="/assets/help-2-find-div.png"
                    />
                    <CardContent>
                        <Typography gutterBottom variant="h5" component="div">
                            3. Find json
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Go to the search bar (1) and type: 'data-component-name="CaseCardsApp"' and hit enter.
                            You can then right click on the highlighted element (2) and select "Copy" then "Inner HTML"
                            (3).
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ maxWidth: 750 }}>
                    <CardMedia
                        component="img"
                        alt="paste json"
                        image="/assets/help-3-paste-json.png"
                    />
                    <CardContent>
                        <Typography gutterBottom variant="h5" component="div">
                            4. Paste json
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            And finally paste the JSON into the text box.
                        </Typography>
                    </CardContent>
                </Card>
            </Stack>
        </>
    )
}

