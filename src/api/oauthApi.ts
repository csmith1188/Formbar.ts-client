import { http } from "@api/HTTPApi";

export type OAuthAuthorizeParams = {
	clientId: string;
	redirectUri: string;
	scope: string;
	state: string;
	responseType?: string;
};

export type OAuthAuthorizationMetadata = {
	id: number;
	name: string;
	description?: string;
	redirectUri: string;
	requestedScopes: string[];
};

function buildAuthorizeQuery(params: OAuthAuthorizeParams) {
	const query = new URLSearchParams();
	query.set("client_id", params.clientId);
	query.set("redirect_uri", params.redirectUri);
	query.set("scope", params.scope);
	query.set("state", params.state);

	if (params.responseType) {
		query.set("response_type", params.responseType);
	}

	return query;
}

export async function getOAuthAuthorizationMetadata(params: OAuthAuthorizeParams): Promise<OAuthAuthorizationMetadata> {
	const response = await http(`/oauth/authorize/metadata?${buildAuthorizeQuery(params).toString()}`, "GET", {
		Accept: "application/json",
	});

	return response.data;
}

export async function authorizeOAuthApp(params: OAuthAuthorizeParams): Promise<string> {
	const query = buildAuthorizeQuery(params);
	query.set("response_mode", "json");

	const response = await http(`/oauth/authorize?${query.toString()}`, "GET", {
		Accept: "application/json",
	});

	const redirectUrl = response?.data?.redirectUrl;
	if (typeof redirectUrl !== "string" || !redirectUrl) {
		throw new Error("OAuth authorization did not return a redirect URL.");
	}

	return redirectUrl;
}
