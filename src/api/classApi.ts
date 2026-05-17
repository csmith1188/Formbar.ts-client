import type { SavedPollTemplateBody } from "@/types";
import { http } from "@api/HTTPApi";
import { buildPaginationQuery, fetchAllPaginated, type PaginationParams } from "@api/pagination";

// --- Class ---

export function getClass(id: number) {
    return http(`/class/${id}`);
}

export function checkActiveClass(id: number) {
    return http(`/class/${id}/active`);
}

export function getBannedClassStudents(classId: number, { limit, offset }: PaginationParams = {}) {
    return http(`/class/${classId}/banned${buildPaginationQuery({ limit, offset })}`);
}

export function getClassPermissions(classId: number) {
    return http(`/class/${classId}/permissions`);
}

export function getClassStudents(classId: number, { limit, offset }: PaginationParams = {}) {
    return http(`/class/${classId}/students${buildPaginationQuery({ limit, offset })}`);
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
    return http(`/class/${classId}/polls${buildPaginationQuery({ limit, offset })}`);
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
    excludedRespondents: any[],
    indeterminate: any[],
    allowTextResponses: boolean,
    allowMultipleResponses: boolean,    
    allowVoteChanges: boolean,
    blindUntilEnded: boolean,
    autoEndTimer: number | null,
    autoEndThreshold: number | null,
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

export function getClassPollTemplates(classId: number) {
    return http(`/class/${classId}/polls/templates`);
}

export function savePollTemplateToClass(classId: number, body: SavedPollTemplateBody) {
    return http(`/class/${classId}/polls/templates`, "POST", {}, body);
}

// --- Class - Breaks ---

export function endBreak(classId: number) {
    return http(`/class/${classId}/break/end`, "POST");
}

export function requestBreak(classId: number, reason: string) {
    return http(`/class/${classId}/break/request`, "POST", {}, { reason });
}

export function approveStudentBreak(classId: number, studentId: number) {
    return http(`/class/${classId}/students/${studentId}/break/approve`, "POST");
}

export function denyStudentBreak(classId: number, studentId: number) {
    return http(`/class/${classId}/students/${studentId}/break/deny`, "POST");
}

export function endStudentBreak(classId: number, studentId: number) {
	return http(`/class/${classId}/students/${studentId}/break/end`, "POST");
}


// -- Class - Help ---

export function deleteHelpRequest(classId: number, userId: number) {
    return http(`/class/${classId}/students/${userId}/help`, "DELETE");
}

export function requestHelp(classId: number, reason: string) {
    return http(`/class/${classId}/help/request`, "POST", {}, { reason });
}

// --- Class - Enrollment ---

export function enrollInClass(code: string) {
    return http(`/class/enroll/${code}`, "POST");
}

export function unenrollFromClass(classId: number) {
	return http(`/class/${classId}/unenroll`, "POST");
}

export function deleteClass(classId: number) {
    return http(`/class/${classId}`, "DELETE");
}

// --- Class - Links ---

export function deleteClassLink(classId: number, linkName: string) {
    return http(`/class/${classId}/links`, "DELETE", {}, { name: linkName });
}

export function getClassLinks(classId: number, { limit, offset }: PaginationParams = {}) {
    return http(`/class/${classId}/links${buildPaginationQuery({ limit, offset })}`);
}

export function getAllClassLinks(classId: number) {
    return fetchAllPaginated<{ name: string; url: string }>(
        ({ limit, offset }) => `/class/${classId}/links${buildPaginationQuery({ limit, offset })}`,
        (data) => {
            const links = (data as { links?: unknown })?.links;
            return Array.isArray(links) ? links : [];
        },
    );
}

export function createClassLink(classId: number, body: {
    name: string,
    url: string,
}) {
    return http(`/class/${classId}/links/add`, "POST", {}, body);
}

export function updateClassLink(classId: number, body: {
    oldName: string,
    name: string,
    url: string,
}) {
    return http(`/class/${classId}/links`, "PUT", {}, body);
}

export function kickClassStudent(classId: number, studentId: number) {
    return http(`/class/${classId}/students/${studentId}/kick`, "POST");
}

export function banClassStudent(classId: number, studentId: number) {
    return http(`/class/${classId}/students/${studentId}/ban`, "POST");
}

export function kickAllStudents(classId: number) {
    return http(`/class/${classId}/students/kick-all`, "POST");
}

export function regenerateClassCode(classId: number) {
    return http(`/class/${classId}/code/regenerate`, "POST");
}

export function updateSettings(classId: number, body: any) {
    return http(`/class/${classId}/settings`, "PATCH", {}, body);
}
