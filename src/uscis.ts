export {EventCodes} from "./uscisEventCodes.ts"

export type EmbeddedCase = {
    receiptNumber: string,
    formType: string,
    formName: string,
    closed: boolean,
    ackedByAdjudicatorAndCms: boolean,
    applicantName: string,
    areAllGroupStatusesComplete: boolean,
    areAllGroupMembersAuthorizedForTravel: boolean,
    isPremiumProcessing: boolean,
    actionRequired: boolean,
    concurrentCases: EmbeddedCase[],
    documents: [],
    evidenceRequests: [],
    notices: EmbeddedNotice[],
    events: EmbeddedEvent[],
    submissionDate: string,
    submissionTimestamp: string,
    updatedAt: string,
    updatedAtTimestamp: string,
}

type EmbeddedEvent = {
    receiptNumber: string,
    eventId: string,
    eventCode: string,
    createdAt: string,
    createdAtTimestamp: string,
    updatedAt: string,
    updatedAtTimestamp: string,
    eventDateTime: string,
    eventTimestamp: string,
}

type EmbeddedNotice = {
    receiptNumber: string,
    letterId: string,
    generationDate: string,
    appointmentDateTime: string,
    actionType: string,
}

export type Document = {
    contentId: string
    fileName: string
    type: string
    sourceType: string
    createDate: string
}

export function GetApplicationsFromEmbeddedData(): EmbeddedCase[] {
    let dataElement = document.querySelector("script[data-component-name='CaseCardsApp']")
    let result: { cases: EmbeddedCase[] } = JSON.parse(dataElement.textContent);
    return result.cases.flatMap((application) => [application, ...application.concurrentCases]);
}

export class Client {
    baseUrl: string = "https://my.uscis.gov"

    init() {}

    listDocuments(applicationId: string): Promise<{ data: Document[] }> {
        return fetch(this.baseUrl + `/account/case-service/api/cases/${applicationId}/documents`).then(value => {
            return value.json()
        }).then(value => {
            return value as { data: Document[] }
        })
    }
}