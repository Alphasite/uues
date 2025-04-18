//class UscisClient {
//    url: string;
//    graphqlUrl: string;
//
//    constructor() {
//        this.url = "https://my.uscis.gov/account/case-service";
//        this.graphqlUrl = "https://my.uscis.gov/account/graphql";
//    }
//
//    // https://my.uscis.gov/account/case-service/api/cases/I-131/processing_times/IOE0930929457
//    // https://my.uscis.gov/account/case-service/api/cases/IOE0930929456/
//}

export type EmbeddedCase = {
    receiptNumber: string,
    submissionDate: string,
    formType: string,
    formName: string,
    closed: string,
    ackedByAdjudicatorAndCms: string,
    applicantName: string,
    areAllGroupStatusesComplete: Boolean,
    areAllGroupMembersAuthorizedForTravel: Boolean,
    isPremiumProcessing: Boolean,
    actionRequired: Boolean,
    concurrentCases: EmbeddedCase[],
    documents: [],
    evidenceRequests: [],
    notices: EmbeddedNotice[],
    events: EmbeddedEvent[],
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

export function GetApplicationsFromEmbeddedData(): EmbeddedCase[] {
    let dataElement = document.querySelector("script[data-component-name='CaseCardsApp']")
    let result: {cases: EmbeddedCase[]} = JSON.parse(dataElement.textContent);
    return result.cases.flatMap((application) => [application, ...application.concurrentCases]);
}
