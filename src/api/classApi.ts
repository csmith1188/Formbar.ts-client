import { http } from "./HTTPApi";

// --- Class ---

export function getClass(id: number) {
    return http(`/class/${id}`);
}

export function checkActiveClass(id: number) {
    return http(`/class/${id}/active`);
}

export function getBannedClassStudents(classId: number) {
    return http(`/class/${classId}/banned`);
}

export function getClassPermissions(classId: number) {
    return http(`/class/${classId}/permissions`);
}

export function getClassStudents(classId: number) {
    return http(`/class/${classId}/students`);
}

export function createClass(body: {
    name: string,
}) {
    return http("/class/create", "POST", {}, body);
}

export function endClassSession(classId: number) {
    return http(`/class/${classId}/end`, "POST");
}

export function joinClassSession(classId: number) {
    return http(`/class/${classId}/join`, "POST");
}

export function leaveClassSession(classId: number) {
    return http(`/class/${classId}/leave`, "POST");
}

export function startClassSession(classId: number) {
    return http(`/class/${classId}/start`, "POST");
}

// --- Class - Polls ---

export function getPolls(classId: number, limit: number = 20, offset: number = 0) {
    return http(`/class/${classId}/polls${limit > -1 && offset > -1 ? `?limit=${limit}&offset=${offset}` : ''}`);
}

export function getCurrentPoll(classId: number) {
    return http(`/class/${classId}/polls/current`);
}

export function clearCurrentPoll(classId: number) {
    return http(`/class/${classId}/polls/clear`, "POST");
}

export function createPoll(classId: number, body: {
    prompt: string,
    answers: any[],
    blind: boolean,
    weight: number,
    tags: string[],
    excludedRespondents: any[],
    indeterminate: any[],
    allowTextResponses: boolean,
    allowMultipleResponses: boolean,    
    allowVoteChanges: boolean
}) {
    return http(`/class/${classId}/polls/create`, "POST", {}, body);
}

export function endPoll(classId: number) {
    return http(`/class/${classId}/polls/end`, "POST");
}

export function submitPollResponse(classId: number, body: {
    response: any,
    textRes?: string
}) {
    return http(`/class/${classId}/polls/response`, "POST", {}, body);
}


// --- Class - Breaks ---

export function endBreak(classId: number) {
    return http(`/class/${classId}/break/end`, "POST");
}

export function requestBreak(classId: number, reason: string) {
    return http(`/class/${classId}/break/request`, "POST", {}, { reason });
}

export function approveStudentBreak(classId: number, studentId: string) {
    return http(`/class/${classId}/students/${studentId}/break/approve`, "POST");
}

export function denyStudentBreak(classId: number, studentId: string) {
    return http(`/class/${classId}/students/${studentId}/break/deny`, "POST");
}


// -- Class - Help ---

export function deleteHelpRequest(classId: number, userId: string) {
    return http(`/class/${classId}/students/${userId}/help`, "DELETE");
}

export function requestHelp(classId: number) {
    return http(`/class/${classId}/help/request`, "POST");
}