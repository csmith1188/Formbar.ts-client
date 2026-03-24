import { http } from "./HTTPApi";

// DELETE: Delete a user
export function deleteUser(id: string) {
	return http(`/user/${id}`, "DELETE");
}

// GET: Get a user by ID
export function getUser(id: string) {
	return http(`/user/${id}`);
}

// GET: Get the current user
export function getMe() {
	return http("/user/me");
}

// GET: Get a user's active class
export function getUserActiveClass(id: string) {
	return http(`/user/${id}/class`);
}

// GET /user/{id}/classes
export function getUserClasses(id: string) {
	return http(`/user/${id}/classes`);
}

// GET /user/{id}/scopes
export function getUserScopes(id: string) {
	return http(`/user/${id}/scopes`);
}

// GET /user/{id}/transactions
export function getUserTransactions(id: string, limit: number = 20, offset: number = 0) {
	return http(`/user/${id}/transactions${limit > -1 && offset > -1 ? `?limit=${limit}&offset=${offset}` : ''}`, "GET");
}

// PATCH /user/{id}/ban
export function banUser(id: string) {
	return http(`/user/${id}/ban`, "PATCH");
}

// PATCH /user/{id}/perm
export function updateUserPermissions(id: string, body: { perm: number }) {
	return http(`/user/${id}/perm`, "PATCH", {}, body);
}

// PATCH /user/{id}/pin
export function updateUserPin(id: string, body: { oldPin: string, pin: string } | { pin: string }) {
	return http(`/user/${id}/pin`, "PATCH", {}, body);
}

// PATCH /user/{id}/unban
export function unbanUser(id: string) {
	return http(`/user/${id}/unban`, "PATCH");
}

// PATCH /user/{id}/verify
export function verifyUser(id: string) {
	return http(`/user/${id}/verify`, "PATCH");
}

// POST /user/{id}/verify/request
export function requestUserVerificationEmail(id: string) {
    return http(`/user/${id}/verify/request`, "POST");
}

// PATCH /user/pin/reset
export function resetPinWithToken(pin: string, token: string) {
	return http(`/user/pin/reset`, "PATCH", {}, { pin, token });
}

// POST /user/{id}/api/regenerate
export function regenerateUserApiKey(id: string) {
	return http(`/user/${id}/api/regenerate`, "POST");
}

// POST /user/{id}/pin/reset
export function requestUserPinReset(id: string) {
	return http(`/user/${id}/pin/reset`, "POST");
}

// POST /user/{id}/pin/verify
export function verifyUserPin(id: string, body: { pin: string }) {
	return http(`/user/${id}/pin/verify`, "POST", {}, body);
}

export function getUserPools(id: string, limit: number = 20, offset: number = 0) {
    return http(`/user/${id}/pools${limit > -1 && offset > -1 ? `?limit=${limit}&offset=${offset}` : ''}`, "GET");
}

export function verifyUserEmail(code: string) {
    return http(`/user/verify/email?code=${code}`, "POST", {Accept: "application/json"}, { code });
}