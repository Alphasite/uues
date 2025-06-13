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

export function findCases(object: any): EmbeddedCase[] {
    if (object === null || object === undefined) {
        return []
    }

    if (Array.isArray(object)) {
        return object.flatMap(obj => findCases(obj))
    }

    if (typeof object == 'object') {
        let cases = Object.entries(object)
            .flatMap(([_, value]) => findCases(value))

        if (isCase(object)) {
            object.concurrentCases = cases.map(application => application.receiptNumber)
            cases.push(object)
        }

        return cases
    }

    return []
}

function isCase(object: any): boolean {
    return object["formType"] !== undefined;
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