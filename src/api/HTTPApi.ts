import { accessToken } from "@utils/socket";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
const apiVersion = "v1";
const anonymousClientIdStorageKey = "anonymousClientId";
const anonymousClientIdPaths = new Set([
	"/certs",
	"/config",
	"/auth/refresh",
	"/auth/register",
	"/auth/login"
]);

let apiErrorReporter: ((message: string) => void) | null = null;
const reportedApiErrors = new WeakSet<object>();

export function registerApiErrorReporter(
	reporter: (message: string) => void,
): () => void {
	apiErrorReporter = reporter;

	return () => {
		if (apiErrorReporter === reporter) {
			apiErrorReporter = null;
		}
	};
}

export function reportApiError(error: unknown, fallback: string): void {
	const message =
		error instanceof Error && error.message ? error.message : fallback;
	if (typeof error === "object" && error !== null) {
		reportedApiErrors.add(error);
	}
	apiErrorReporter?.(message);
}

export function wasApiErrorReported(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		reportedApiErrors.has(error)
	);
}

function getToken() {
	return accessToken;
}

function getErrorMessage(text: string, statusText: string): string {
	if (!text) return statusText;

	try {
		const payload = JSON.parse(text) as {
			error?: string | { message?: string };
			message?: string;
		};

		if (typeof payload.error === "string") return payload.error;
		if (payload.error?.message) return payload.error.message;
		if (payload.message) return payload.message;
	} catch {
		// Keep the original response text when it is not JSON.
	}

	return text;
}

export async function http(
	path: string,
	method: HttpMethod = "GET",
	headers?: Record<string, string>,
	body?: unknown,
): Promise<any> {
	const baseUrl = import.meta.env.VITE_FORMBAR_API_URL ?? "";
	const token = getToken();
	const usesAnonymousClientId = anonymousClientIdPaths.has(path);
	let anonymousClientId = usesAnonymousClientId
		? localStorage.getItem(anonymousClientIdStorageKey)
		: null;
	const requestUrl = `${baseUrl}/api/${apiVersion}${path}`;

	try {
		const requestOptions: RequestInit = {
			method,
			headers: {
				"Content-Type": headers?.["Content-Type"] || "application/json",
				Authorization: token ? `Bearer ${token}` : "",
				...(anonymousClientId
					? { "X-Anonymous-Client-Id": anonymousClientId }
					: {}),
				...(headers || {}),
			},
			...(body !== undefined
				? {
						body:
							body instanceof URLSearchParams
								? body.toString()
								: JSON.stringify(body),
					}
				: {}),
		};
		let res = await fetch(requestUrl, requestOptions);

		if (usesAnonymousClientId && !anonymousClientId && !res.ok) {
			const newAnonymousClientId = res.headers.get(
				"X-Anonymous-Client-Id",
			);
			if (newAnonymousClientId) {
				anonymousClientId = newAnonymousClientId;
				localStorage.setItem(
					anonymousClientIdStorageKey,
					newAnonymousClientId,
				);
				(requestOptions.headers as Record<string, string>)[
					"X-Anonymous-Client-Id"
				] = newAnonymousClientId;
				res = await fetch(requestUrl, requestOptions);
			}
		}

		if (usesAnonymousClientId) {
			const newAnonymousClientId = res.headers.get(
				"X-Anonymous-Client-Id",
			);
			if (newAnonymousClientId) {
				localStorage.setItem(
					anonymousClientIdStorageKey,
					newAnonymousClientId,
				);
			}
		}

		if (!res.ok) {
			const text = await res.text().catch(() => "");
			throw new Error(getErrorMessage(text, res.statusText));
		}

		// Handles 204 No Content
		if (res.status === 204) return undefined;

		const response = await res.json();
		response.ok = res.ok;

		return response;
	} catch (error) {
		reportApiError(error, `API request failed: ${method} ${path}`);
		throw error;
	}
}
