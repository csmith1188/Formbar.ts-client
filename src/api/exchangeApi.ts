import { http } from "@api/HTTPApi";
import {
	buildPaginationQuery,
	type PaginationParams,
} from "@api/pagination";

export function getExchangeById(exchangeId: string) {
	return http(`/exchanges/${encodeURIComponent(exchangeId)}`);
}

export function getUserExchanges(
	userId: string,
	params: PaginationParams = {},
) {
	return http(
		`/user/${encodeURIComponent(userId)}/exchanges${buildPaginationQuery(params)}`,
	);
}

export function createExchange(body: any) {
	return http(`/exchanges`, "POST", {}, body);
}

export function acceptExchange(exchangeId: string, pin: string) {
	return http(`/exchanges/${encodeURIComponent(exchangeId)}/accept`, "POST", {}, { pin });
}

export function cancelExchange(exchangeId: string, pin: string) {
	return http(
		`/exchanges/${encodeURIComponent(exchangeId)}/cancel`,
		"POST",
		{},
		{ pin },
	);
}

export function rejectExchange(exchangeId: string, pin: string) {
	return http(`/exchanges/${encodeURIComponent(exchangeId)}/reject`, "POST", {}, { pin });
}