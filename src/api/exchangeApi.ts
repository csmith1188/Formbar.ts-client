import { http } from "@api/HTTPApi";

export function getExchangeById(exchangeId: string) {
	return http(`/exchanges/${encodeURIComponent(exchangeId)}`);
}

export function getUserExchanges(userId: string) {
	return http(`/user/${encodeURIComponent(userId)}/exchanges`);
}

export function createExchange(body: any) {
	return http(`/exchanges`, "POST", {}, body);
}

export function acceptExchange(exchangeId: string, pin: string) {
	return http(`/exchanges/${encodeURIComponent(exchangeId)}/accept`, "POST", {}, { pin });
}

export function cancelExchange(exchangeId: string) {
	return http(`/exchanges/${encodeURIComponent(exchangeId)}/cancel`, "POST");
}

export function rejectExchange(exchangeId: string, pin: string) {
	return http(`/exchanges/${encodeURIComponent(exchangeId)}/reject`, "POST", {}, { pin });
}