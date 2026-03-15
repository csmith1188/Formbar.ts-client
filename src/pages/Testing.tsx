import {
	Alert,
	Button,
	Card,
	Flex,
	Space,
	Table,
	Tag,
	Typography,
} from "antd";
import { useEffect, useState } from "react";
import FormbarHeader from "../components/FormbarHeader";
import { getAppearAnimation, useSettings } from "../main";
import { accessToken, formbarUrl, refreshToken } from "../socket";
import { type CurrentUserData } from "../types";

// ─── Types ───────────────────────────────────────────────────────────────────

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type TestStatus = "pending" | "running" | "passed" | "failed" | "skipped";
type TestPhase = "setup" | "main" | "teardown";
type SwaggerParameterLocation = "path" | "query" | "header" | "cookie";

type ApiResponse = {
	ok: boolean;
	status: number;
	body: unknown;
	rawText: string;
	/** True when the server responded with HTTP 429 (rate limit). */
	isRateLimit?: boolean;
	/** Milliseconds to wait before retrying (parsed from Retry-After or defaulting to 60 s). */
	retryAfterMs?: number;
};

type TestResult = {
	key: string;
	phase: TestPhase;
	category: string;
	label: string;
	method: HttpMethod;
	path: string;
	status: TestStatus;
	statusCode?: number;
	details: string;
	durationMs?: number;
};

type StaticIssue = {
	key: string;
	category: string;
	method: HttpMethod;
	path: string;
	reason: string;
};

type SwaggerSchema = {
	$ref?: string;
	type?: string;
	format?: string;
	enum?: unknown[];
	default?: unknown;
	example?: unknown;
	items?: SwaggerSchema;
	properties?: Record<string, SwaggerSchema>;
	required?: string[];
	additionalProperties?: boolean | SwaggerSchema;
	nullable?: boolean;
	allOf?: SwaggerSchema[];
	anyOf?: SwaggerSchema[];
	oneOf?: SwaggerSchema[];
	minimum?: number;
	maximum?: number;
};

type SwaggerExample = {
	value?: unknown;
};

type SwaggerParameter = {
	name?: string;
	in?: SwaggerParameterLocation;
	required?: boolean;
	description?: string;
	schema?: SwaggerSchema;
	example?: unknown;
	examples?: Record<string, SwaggerExample>;
};

type SwaggerMediaType = {
	schema?: SwaggerSchema;
	example?: unknown;
	examples?: Record<string, SwaggerExample>;
};

type SwaggerRequestBody = {
	required?: boolean;
	content?: Record<string, SwaggerMediaType>;
};

type SwaggerResponse = {
	description?: string;
	content?: Record<string, SwaggerMediaType>;
};

type SwaggerOperationDefinition = {
	summary?: string;
	description?: string;
	tags?: unknown[];
	security?: Array<Record<string, unknown>>;
	parameters?: SwaggerParameter[];
	requestBody?: SwaggerRequestBody;
	responses?: Record<string, SwaggerResponse>;
};

type SwaggerPathItem = Partial<
	Record<Lowercase<HttpMethod>, SwaggerOperationDefinition>
> & {
	parameters?: SwaggerParameter[];
};

type SwaggerSpec = {
	paths?: Record<string, SwaggerPathItem>;
	components?: {
		schemas?: Record<string, SwaggerSchema>;
	};
};

type SwaggerOperation = {
	key: string;
	phase: TestPhase;
	category: string;
	label: string;
	method: HttpMethod;
	path: string;
	apiPath: string;
	summary: string;
	parameters: SwaggerParameter[];
	security: Array<Record<string, unknown>>;
	requestBody?: SwaggerRequestBody;
	requestContentType: string | null;
	autoRunBlocker: string | null;
	resourceNames: string[];
};

type CurrentLoginData = CurrentUserData & {
	classId?: number | null;
	digipogs?: number;
};

// A flat normalized-key → string[] map shared across the test run.
// Responses are harvested into it so later requests can pick up live IDs.
type ValuePool = Map<string, string[]>;

type SecondaryUserContext = {
	email: string;
	password: string;
	displayName: string;
	id?: string;
	accessToken?: string;
	refreshToken?: string;
	pin?: string;
};

type TestingContext = {
	me: CurrentLoginData;
	valuePool: ValuePool;
	secondaryUser: SecondaryUserContext;
};

type RequestActor = "primary" | "secondary" | "public";

type PreparedRequestBody = {
	contentType: string;
	value: unknown;
};

type RequestPreparationResult =
	| {
			ok: true;
			path: string;
			headers: Record<string, string>;
			body?: PreparedRequestBody;
	  }
	| { ok: false; reason: string };

type SchemaValueBuildOptions = {
	explicitOnly?: boolean;
	parameterMode?: boolean;
	propertyName?: string;
	resourceNames?: string[];
	valuePool?: ValuePool;
	currentUser?: CurrentLoginData;
	seenRefs?: Set<string>;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const SUPPORTED_HTTP_METHODS: HttpMethod[] = [
	"GET",
	"POST",
	"PUT",
	"PATCH",
	"DELETE",
];

const SUPPORTED_REQUEST_CONTENT_TYPES = [
	"application/json",
	"application/x-www-form-urlencoded",
	"text/plain",
] as const;

const AUTO_TEST_PASSWORD = "Password123!";
const AUTO_TEST_PIN = "1234";
const AUTO_TEST_DISPLAY_NAME = "Auto Test User";

// Setup operations run first (in this order) before the main test suite.
// They establish class state so class-scoped endpoints have real IDs to use.
// Matched by method + normalised apiPath against whatever the Swagger spec exposes.
const SETUP_API_PATHS: Array<{ method: HttpMethod; apiPath: string }> = [
	{ method: "POST", apiPath: "/auth/register" },
	{ method: "PATCH", apiPath: "/user/{id}/verify" },
	{ method: "POST", apiPath: "/auth/login" },
	{ method: "POST", apiPath: "/class/create" },
	{ method: "POST", apiPath: "/class/{id}/join" },
	{ method: "POST", apiPath: "/class/{id}/start" },
	{ method: "POST", apiPath: "/room/{code}/join" },
];

// Teardown operations run last to clean up test state.
const TEARDOWN_API_PATHS: Array<{ method: HttpMethod; apiPath: string }> = [
	{ method: "POST", apiPath: "/class/{id}/end" },
	{ method: "POST", apiPath: "/class/{id}/leave" },
	{ method: "POST", apiPath: "/room/{id}/leave" },
	{ method: "PATCH", apiPath: "/user/{id}/ban" },
	{ method: "PATCH", apiPath: "/user/{id}/unban" },
	{ method: "DELETE", apiPath: "/room/{id}" },
	{ method: "DELETE", apiPath: "/user/{id}" },
];

const MAIN_MUTATION_ORDER: Array<{ method: HttpMethod; apiPath: string }> = [
	{ method: "PATCH", apiPath: "/user/{id}/pin" },
	{ method: "POST", apiPath: "/user/{id}/pin/verify" },
	{ method: "POST", apiPath: "/digipogs/award" },
	{ method: "POST", apiPath: "/digipogs/transfer" },
	{ method: "POST", apiPath: "/class/{id}/polls/create" },
	{ method: "POST", apiPath: "/class/{id}/polls/response" },
	{ method: "POST", apiPath: "/class/{id}/polls/end" },
	{ method: "POST", apiPath: "/class/{id}/polls/clear" },
	{ method: "POST", apiPath: "/class/{id}/timer/start" },
	{ method: "POST", apiPath: "/class/{id}/timer/end" },
	{ method: "POST", apiPath: "/class/{id}/timer/clear" },
	{ method: "POST", apiPath: "/room/{id}/links/add" },
	{ method: "PUT", apiPath: "/room/{id}/links" },
	{ method: "DELETE", apiPath: "/room/{id}/links" },
	{ method: "POST", apiPath: "/room/{id}/links/remove" },
	{ method: "POST", apiPath: "/room/{id}/links/change" },
	{ method: "PUT", apiPath: "/room/tags" },
	{ method: "POST", apiPath: "/room/tags" },
	{ method: "POST", apiPath: "/class/{id}/help/request" },
	{ method: "DELETE", apiPath: "/class/{id}/students/{userId}/help" },
	{ method: "POST", apiPath: "/class/{id}/break/request" },
	{ method: "POST", apiPath: "/class/{id}/students/{userId}/break/approve" },
	{ method: "POST", apiPath: "/class/{id}/break/end" },
	{ method: "POST", apiPath: "/class/{id}/students/{userId}/break/deny" },
];

// Pool keys to wipe when a setup operation fails, so downstream tests that
// depend on those resources are skipped cleanly instead of running with a
// stale or wrong ID.
const SETUP_FAILURE_INVALIDATES: Partial<Record<string, string[]>> = {
	// If temp-class creation fails, do not let later setup/main requests fall
	// back to a pre-seeded active class from /user/me.
	"POST:/class/create": ["classid", "roomid", "roomcode", "classkey"],
	// If joining fails, later class-scoped requests would mostly return auth
	// errors because the user is not attached to the test class.
	"POST:/class/{id}/join": ["classid", "roomid"],
	// If starting fails, most class-scoped endpoints would cascade with
	// inactive-class errors. Remove the class id so they are skipped cleanly.
	"POST:/class/{id}/start": ["classid"],
};

// ─── Utilities ───────────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function getResponseData<T>(payload: unknown): T | undefined {
	if (!isRecord(payload) || !("data" in payload)) return undefined;
	return payload.data as T;
}

function truncate(value: string, limit = 160): string {
	return value.length > limit ? `${value.slice(0, limit - 3)}...` : value;
}

function summarizePayload(payload: unknown): string {
	if (typeof payload === "string") return truncate(payload);
	if (isRecord(payload)) {
		if ("error" in payload) {
			const e = payload.error;
			if (typeof e === "string") return truncate(e);
			if (isRecord(e) && typeof e.message === "string")
				return truncate(e.message);
		}
		if ("message" in payload && typeof payload.message === "string")
			return truncate(payload.message);
	}
	try {
		return truncate(JSON.stringify(payload));
	} catch {
		return "Response received.";
	}
}

function getStatusTag(status: TestStatus) {
	switch (status) {
		case "passed":
			return <Tag color="green">Passed</Tag>;
		case "failed":
			return <Tag color="red">Failed</Tag>;
		case "running":
			return <Tag color="blue">Running</Tag>;
		case "skipped":
			return <Tag color="orange">Skipped</Tag>;
		default:
			return <Tag>Pending</Tag>;
	}
}

function singularize(word: string): string {
	if (word.endsWith("ies")) return word.slice(0, -3) + "y";
	if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
	return word;
}

function normalizeKey(key: string): string {
	return key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function matchesOperation(
	operation: Pick<SwaggerOperation, "apiPath" | "method">,
	method: HttpMethod,
	apiPath: string,
): boolean {
	return operation.method === method && operation.apiPath === apiPath;
}

function createSecondaryUserContext(): SecondaryUserContext {
	const seed = Date.now().toString(36).toLowerCase();
	const suffix = seed.slice(-6).toUpperCase();
	return {
		email: `autotest+${seed}@example.com`,
		password: AUTO_TEST_PASSWORD,
		displayName: `AutoTest${suffix}`.slice(0, 20),
	};
}

// ─── Value Pool ───────────────────────────────────────────────────────────────
// A flat key→values map. Keys are normalised (lowercase alphanumeric).
// Resource-scoped priority is achieved by constructing prefixed lookup names
// in the caller (e.g. "classid" before generic "id") so the correct ID wins
// when both a userId and a classId are in the pool under the "id" key.

function createValuePool(): ValuePool {
	return new Map();
}

function addToPool(pool: ValuePool, key: string, value: unknown) {
	const str =
		typeof value === "string"
			? value
			: typeof value === "number" || typeof value === "boolean"
				? String(value)
				: null;
	if (!str) return;
	const k = normalizeKey(key);
	if (!k) return;
	const existing = pool.get(k);
	if (existing) {
		if (!existing.includes(str)) existing.push(str);
	} else {
		pool.set(k, [str]);
	}
}

/**
 * Like addToPool but REPLACES any existing entry rather than appending.
 * Used by setup operations so newly-created IDs take priority over values
 * that were pre-seeded from /user/me.
 */
function setInPool(pool: ValuePool, key: string, value: unknown) {
	const str =
		typeof value === "string"
			? value
			: typeof value === "number" || typeof value === "boolean"
				? String(value)
				: null;
	if (!str) return;
	const k = normalizeKey(key);
	if (!k) return;
	pool.set(k, [str]);
}

/**
 * Harvest scalar values from an API response into the pool.
 *
 * parentResourceHint carries the singular resource name of the collection an
 * object was found inside (e.g. "notification" when iterating
 * `data.notifications[]`).  When present, id-like property keys ("id" or keys
 * ending with "id") are ALSO stored under the resource-qualified key so that
 * endpoints like GET /notifications/{id} can find "notificationid" in the pool
 * and distinguish it from the user's generic "id".
 */
function harvestPool(
	pool: ValuePool,
	value: unknown,
	keyHint?: string,
	parentResourceHint?: string,
) {
	if (value == null || typeof value === "function") return;
	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		if (keyHint) {
			addToPool(pool, keyHint, value);
			// Also index under the resource-qualified key so callers that
			// search for e.g. "notificationid" find it before the bare "id".
			if (parentResourceHint) {
				const norm = normalizeKey(keyHint);
				if (norm === "id" || norm.endsWith("id")) {
					const qualified = `${parentResourceHint}${norm}`;
					if (qualified !== norm)
						addToPool(pool, qualified, value);
				}
			}
		}
		return;
	}
	if (Array.isArray(value)) {
		// Derive the singular resource name from the array's key so it can be
		// passed down as the parentResourceHint for each item.
		const childResource = keyHint
			? singularize(normalizeKey(keyHint))
			: parentResourceHint;
		for (const item of value)
			harvestPool(pool, item, childResource, childResource);
		return;
	}
	if (isRecord(value)) {
		const nextParentResourceHint = keyHint
			? singularize(normalizeKey(keyHint))
			: parentResourceHint;
		for (const [k, v] of Object.entries(value)) {
			harvestPool(pool, v, k, nextParentResourceHint);
		}
	}
}

/**
 * Like harvestPool but replaces existing pool entries for id-like keys
 * instead of appending.  Used for setup-phase responses so that a freshly
 * created classId overwrites the one pre-seeded from /user/me.
 */
function priorityHarvestPool(
	pool: ValuePool,
	value: unknown,
	keyHint?: string,
) {
	if (value == null || typeof value === "function") return;
	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		if (keyHint) {
			const norm = normalizeKey(keyHint);
			if (norm === "id" || norm.endsWith("id")) {
				setInPool(pool, keyHint, value);
			} else {
				addToPool(pool, keyHint, value);
			}
		}
		return;
	}
	if (Array.isArray(value)) {
		for (const item of value)
			priorityHarvestPool(
				pool,
				item,
				keyHint ? singularize(keyHint) : undefined,
			);
		return;
	}
	if (isRecord(value)) {
		for (const [k, v] of Object.entries(value)) {
			priorityHarvestPool(pool, v, k);
		}
	}
}

// Find the first value matching any of the given names (tried in order).
// Tries exact key, singular, and plural variants.
function findInPool(pool: ValuePool, names: string[]): string | undefined {
	for (const name of names) {
		const k = normalizeKey(name);
		if (!k) continue;
		const direct = pool.get(k);
		if (direct?.length) return direct[0];
		const singular = singularize(k);
		if (singular !== k) {
			const sv = pool.get(singular);
			if (sv?.length) return sv[0];
		}
		const plural = k.endsWith("s") ? k : k + "s";
		if (plural !== k) {
			const pv = pool.get(plural);
			if (pv?.length) return pv[0];
		}
	}
	return undefined;
}

// ─── Schema helpers ───────────────────────────────────────────────────────────

function cloneValue(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(cloneValue);
	if (isRecord(value))
		return Object.fromEntries(
			Object.entries(value).map(([k, v]) => [k, cloneValue(v)]),
		);
	return value;
}

function resolveSchemaReference(
	ref: string,
	spec: SwaggerSpec,
): SwaggerSchema | undefined {
	const prefix = "#/components/schemas/";
	if (!ref.startsWith(prefix)) return undefined;
	return spec.components?.schemas?.[ref.slice(prefix.length)];
}

function getExampleValueFromMap(
	examples?: Record<string, SwaggerExample>,
): unknown {
	if (!examples) return undefined;
	for (const example of Object.values(examples)) {
		if (example?.value !== undefined) return example.value;
	}
	return undefined;
}

function getParameterSeedValue(parameter: SwaggerParameter): unknown {
	if (parameter.example !== undefined) return parameter.example;
	const mapped = getExampleValueFromMap(parameter.examples);
	if (mapped !== undefined) return mapped;
	if (parameter.schema?.example !== undefined) return parameter.schema.example;
	if (parameter.schema?.default !== undefined) return parameter.schema.default;
	if (
		Array.isArray(parameter.schema?.enum) &&
		parameter.schema.enum.length > 0
	)
		return parameter.schema.enum[0];
	return undefined;
}

function stringifyParameterValue(value: unknown): string | null {
	if (value == null) return null;
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean")
		return String(value);
	return null;
}

function getGeneratedSchemaValue(
	schema: SwaggerSchema | undefined,
	options: SchemaValueBuildOptions,
): unknown {
	if (!schema) return undefined;
	const norm = normalizeKey(options.propertyName ?? "");

	if (schema.type === "boolean") return true;

	if (schema.type === "integer" || schema.type === "number") {
		if (norm.includes("offset") || norm.includes("index")) return 0;
		if (norm.includes("limit")) return 5;
		const min =
			typeof schema.minimum === "number" ? schema.minimum : undefined;
		if (min !== undefined) return min > 0 ? min : 0;
		return 1;
	}

	if (schema.type === "string" || schema.format || schema.type == null) {
		if (schema.format === "email" || norm.includes("email"))
			return (
				options.currentUser?.email ??
				`autotest+${Date.now()}@example.com`
			);
		if (schema.format === "password" || norm.includes("password"))
			return AUTO_TEST_PASSWORD;
		if (norm.includes("refreshtoken") || norm === "token")
			return refreshToken || accessToken || undefined;
		if (norm.includes("accesstoken"))
			return accessToken || refreshToken || undefined;
		if (norm.includes("pin")) return "1234";
		if (schema.format === "uri" || norm.includes("url"))
			return "https://example.com";
		if (norm.includes("displayname"))
			return options.currentUser?.displayName ?? AUTO_TEST_DISPLAY_NAME;
		if (norm.includes("reason") || norm.includes("message"))
			return "Automated test payload";
		if (norm.includes("prompt")) return "Automated test prompt";
		if (norm.includes("name")) return AUTO_TEST_DISPLAY_NAME;
		if (options.parameterMode) return undefined;
		return "test";
	}

	return undefined;
}

function buildValueFromSchema(
	schema: SwaggerSchema | undefined,
	spec: SwaggerSpec,
	options: SchemaValueBuildOptions = {},
): unknown {
	if (!schema) return undefined;

	if (schema.$ref) {
		const seenRefs = options.seenRefs ?? new Set<string>();
		if (seenRefs.has(schema.$ref)) return undefined;
		const resolved = resolveSchemaReference(schema.$ref, spec);
		if (!resolved) return undefined;
		return buildValueFromSchema(resolved, spec, {
			...options,
			seenRefs: new Set([...seenRefs, schema.$ref]),
		});
	}

	if (schema.example !== undefined) return cloneValue(schema.example);
	if (schema.default !== undefined) return cloneValue(schema.default);
	if (Array.isArray(schema.enum) && schema.enum.length > 0)
		return cloneValue(schema.enum[0]);

	if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
		const merged: Record<string, unknown> = {};
		let hasObject = false;
		for (const entry of schema.allOf) {
			const v = buildValueFromSchema(entry, spec, options);
			if (isRecord(v)) {
				Object.assign(merged, v);
				hasObject = true;
			} else if (v !== undefined && !hasObject) {
				return v;
			}
		}
		return hasObject ? merged : undefined;
	}

	for (const branch of [schema.oneOf, schema.anyOf]) {
		if (!Array.isArray(branch)) continue;
		for (const entry of branch) {
			const v = buildValueFromSchema(entry, spec, options);
			if (v !== undefined) return v;
		}
	}

	// Pool lookup: prefer a live response value over a generated one.
	if (!options.explicitOnly && options.valuePool && options.propertyName) {
		const pooled = findInPool(options.valuePool, [options.propertyName]);
		if (pooled !== undefined) {
			if (schema.type === "integer") return Math.trunc(Number(pooled));
			if (schema.type === "number") return Number(pooled);
			if (schema.type === "boolean") return pooled === "true";
			return pooled;
		}
	}

	if (schema.type === "array" || schema.items) {
		const itemValue = buildValueFromSchema(schema.items, spec, {
			...options,
			propertyName: options.propertyName
				? singularize(options.propertyName)
				: options.propertyName,
		});
		if (itemValue !== undefined) return [itemValue];
		return options.explicitOnly ? undefined : [];
	}

	if (
		schema.type === "object" ||
		schema.properties ||
		schema.additionalProperties
	) {
		const obj: Record<string, unknown> = {};
		for (const [propName, propSchema] of Object.entries(
			schema.properties ?? {},
		)) {
			const v = buildValueFromSchema(propSchema, spec, {
				...options,
				propertyName: propName,
			});
			if (v !== undefined) obj[propName] = v;
		}
		if (Object.keys(obj).length > 0) return obj;
		if (
			!options.explicitOnly &&
			schema.additionalProperties &&
			schema.additionalProperties !== true
		) {
			const v = buildValueFromSchema(
				schema.additionalProperties as SwaggerSchema,
				spec,
				{ ...options, propertyName: "value" },
			);
			if (v !== undefined) return { sample: v };
		}
		return options.explicitOnly ? undefined : {};
	}

	if (!options.explicitOnly) return getGeneratedSchemaValue(schema, options);
	return undefined;
}

function getMediaTypeExample(
	mediaType: SwaggerMediaType | undefined,
	spec: SwaggerSpec,
	options: SchemaValueBuildOptions = {},
): unknown {
	if (!mediaType) return undefined;
	if (mediaType.example !== undefined) return cloneValue(mediaType.example);
	const mapped = getExampleValueFromMap(mediaType.examples);
	if (mapped !== undefined) return cloneValue(mapped);
	return buildValueFromSchema(mediaType.schema, spec, options);
}

// ─── Request content-type helpers ────────────────────────────────────────────

function isSupportedRequestContentType(contentType: string): boolean {
	return SUPPORTED_REQUEST_CONTENT_TYPES.includes(
		contentType as (typeof SUPPORTED_REQUEST_CONTENT_TYPES)[number],
	);
}

function getPreferredRequestContentType(
	requestBody?: SwaggerRequestBody,
): string | null {
	if (!requestBody?.content) return null;
	for (const preferred of SUPPORTED_REQUEST_CONTENT_TYPES) {
		if (requestBody.content[preferred]) return preferred;
	}
	return Object.keys(requestBody.content)[0] ?? null;
}

// ─── Auto-run blocker ─────────────────────────────────────────────────────────
// Excludes only what is genuinely unsafe or technically infeasible:
//   • DELETE – destructive, always excluded.
//   • Password paths – would silently change credentials.
//   • Cookie params – cannot be set from JavaScript.
//   • Unsupported content types – runner can't serialise the body.
// NODE_ENV is intentionally NOT checked; the user triggers this suite
// explicitly and wants mutations (class create/start/etc.) to run.

function isManagedTeardownOperation(
	apiPath: string,
	method: HttpMethod,
): boolean {
	return TEARDOWN_API_PATHS.some(
		(operation) =>
			operation.apiPath === apiPath && operation.method === method,
	);
}

function getAutoRunBlocker(
	operation: Pick<
		SwaggerOperation,
		"apiPath" | "method" | "security" | "parameters" | "requestContentType"
	>,
): string | null {
	if (
		operation.method === "DELETE" &&
		!isManagedTeardownOperation(operation.apiPath, operation.method)
	)
		return "DELETE endpoints are excluded from auto-run to avoid destructive actions.";

	if (
		operation.apiPath
			.split("/")
			.some((seg) => normalizeKey(seg) === "password")
	)
		return "Password-management endpoints are excluded from auto-run.";

	if (
		operation.security.length > 0 &&
		!operation.security.some(
			(req) =>
				Object.keys(req).length === 0 ||
				Object.keys(req).includes("bearerAuth"),
		)
	)
		return "Requires credentials not available in the browser session.";

	if (operation.parameters.some((p) => p.in === "cookie"))
		return "Requires cookie parameters that cannot be set from JavaScript.";

	if (
		operation.requestContentType &&
		!isSupportedRequestContentType(operation.requestContentType)
	)
		return `Unsupported request body content type: "${operation.requestContentType}".`;

	return null;
}

// ─── Path / operation helpers ─────────────────────────────────────────────────

function normalizeApiPath(path: string): string {
	return path.startsWith("/api/v1") ? path.slice("/api/v1".length) || "/" : path;
}

// Returns non-param path segments (singularised) as resource context hints.
// e.g. /class/{id}/polls/create → ["class", "poll", "create"]
function getOperationResourceNames(apiPath: string): string[] {
	return Array.from(
		new Set(
			apiPath
				.split("/")
				.filter(Boolean)
				.filter((seg) => !/^\{[^}]+\}$/.test(seg))
				.map((seg) => singularize(seg)),
		),
	);
}

function getOperationPhase(apiPath: string, method: HttpMethod): TestPhase {
	if (SETUP_API_PATHS.some((s) => s.method === method && s.apiPath === apiPath))
		return "setup";
	if (
		TEARDOWN_API_PATHS.some(
			(t) => t.method === method && t.apiPath === apiPath,
		)
	)
		return "teardown";
	return "main";
}

function getDeclaredOperationOrder(
	operations: Array<{ method: HttpMethod; apiPath: string }>,
	operation: Pick<SwaggerOperation, "apiPath" | "method">,
): number {
	const index = operations.findIndex(
		(candidate) =>
			candidate.method === operation.method &&
			candidate.apiPath === operation.apiPath,
	);
	return index < 0 ? Number.POSITIVE_INFINITY : index;
}

function getOperationSummary(def: SwaggerOperationDefinition): string {
	if (typeof def.summary === "string" && def.summary.length > 0)
		return def.summary;
	if (typeof def.description === "string" && def.description.length > 0)
		return truncate(def.description.replace(/\s+/g, " "), 120);
	return "";
}

function mergeParameters(
	pathParams: SwaggerParameter[],
	operationParams: SwaggerParameter[],
): SwaggerParameter[] {
	const merged = new Map<string, SwaggerParameter>();
	for (const p of pathParams)
		if (p.name && p.in) merged.set(`${p.in}:${p.name}`, p);
	for (const p of operationParams)
		if (p.name && p.in) merged.set(`${p.in}:${p.name}`, p);
	return Array.from(merged.values());
}

// ─── Build operations from Swagger spec ──────────────────────────────────────

function buildSwaggerOperations(spec: SwaggerSpec): SwaggerOperation[] {
	const operations: SwaggerOperation[] = [];

	for (const [fullPath, pathItem] of Object.entries(spec.paths ?? {})) {
		const sharedParameters = Array.isArray(pathItem.parameters)
			? pathItem.parameters
			: [];

		for (const method of SUPPORTED_HTTP_METHODS) {
			const definition =
				pathItem[method.toLowerCase() as Lowercase<HttpMethod>];
			if (!definition) continue;

			const tags = Array.isArray(definition.tags)
				? definition.tags.filter(
						(t): t is string =>
							typeof t === "string" && t.length > 0,
					)
				: [];
			const apiPath = normalizeApiPath(fullPath);
			const parameters = mergeParameters(
				sharedParameters,
				Array.isArray(definition.parameters)
					? definition.parameters
					: [],
			);
			const security = Array.isArray(definition.security)
				? definition.security
				: [];
			const requestContentType = getPreferredRequestContentType(
				definition.requestBody,
			);
			const phase = getOperationPhase(apiPath, method);

			operations.push({
				key: `${method}:${apiPath}`,
				phase,
				category: tags[0] ?? "Uncategorized",
				label: getOperationSummary(definition) || apiPath,
				method,
				path: apiPath,
				apiPath,
				summary: getOperationSummary(definition),
				parameters,
				security,
				requestBody: definition.requestBody,
				requestContentType,
				autoRunBlocker: getAutoRunBlocker({
					apiPath,
					method,
					security,
					parameters,
					requestContentType,
				}),
				resourceNames: getOperationResourceNames(apiPath),
			});
		}
	}

	// Sort: setup (in declared order) → main GETs → main mutations → teardown.
	const PHASE_ORDER: Record<TestPhase, number> = {
		setup: 0,
		main: 1,
		teardown: 2,
	};

	return operations.sort((a, b) => {
		const phaseCompare = PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase];
		if (phaseCompare !== 0) return phaseCompare;

		if (a.phase === "setup") {
			const ai = SETUP_API_PATHS.findIndex(
				(s) => s.method === a.method && s.apiPath === a.apiPath,
			);
			const bi = SETUP_API_PATHS.findIndex(
				(s) => s.method === b.method && s.apiPath === b.apiPath,
			);
			return (ai < 0 ? Infinity : ai) - (bi < 0 ? Infinity : bi);
		}

		if (a.phase === "teardown") {
			const ai = TEARDOWN_API_PATHS.findIndex(
				(t) => t.method === a.method && t.apiPath === a.apiPath,
			);
			const bi = TEARDOWN_API_PATHS.findIndex(
				(t) => t.method === b.method && t.apiPath === b.apiPath,
			);
			return (ai < 0 ? Infinity : ai) - (bi < 0 ? Infinity : bi);
		}

		// Main phase: GETs before mutations, then shorter paths first.
		const aIsGet = a.method === "GET";
		const bIsGet = b.method === "GET";
		if (aIsGet !== bIsGet) return aIsGet ? -1 : 1;
		if (!aIsGet) {
			const aOrder = getDeclaredOperationOrder(MAIN_MUTATION_ORDER, a);
			const bOrder = getDeclaredOperationOrder(MAIN_MUTATION_ORDER, b);
			if (aOrder !== bOrder) return aOrder - bOrder;
		}
		return a.path.length - b.path.length || a.path.localeCompare(b.path);
	});
}

// ─── Request preparation ──────────────────────────────────────────────────────

function isSecondaryActorOperation(operation: SwaggerOperation): boolean {
	return (
		matchesOperation(operation, "POST", "/room/{code}/join") ||
		matchesOperation(operation, "PATCH", "/user/{id}/pin") ||
		matchesOperation(operation, "POST", "/user/{id}/pin/verify") ||
		matchesOperation(operation, "POST", "/user/{id}/pin/reset") ||
		matchesOperation(operation, "POST", "/user/{id}/verify/request") ||
		matchesOperation(operation, "POST", "/class/{id}/polls/response") ||
		matchesOperation(operation, "POST", "/class/{id}/leave") ||
		matchesOperation(operation, "DELETE", "/room/{id}/leave") ||
		matchesOperation(operation, "POST", "/digipogs/transfer")
	);
}

function shouldTargetSecondaryUser(operation: SwaggerOperation): boolean {
	return (
		operation.apiPath.startsWith("/user/") &&
		operation.apiPath !== "/user/me" &&
		operation.method !== "GET"
	);
}

function getOperationActor(operation: SwaggerOperation): RequestActor {
	if (
		matchesOperation(operation, "POST", "/auth/register") ||
		matchesOperation(operation, "POST", "/auth/login") ||
		matchesOperation(operation, "PATCH", "/user/pin/reset") ||
		matchesOperation(operation, "POST", "/oauth/token") ||
		matchesOperation(operation, "POST", "/oauth/revoke")
	) {
		return "public";
	}
	return isSecondaryActorOperation(operation) ? "secondary" : "primary";
}

function getParameterOverrideValue(
	operation: SwaggerOperation,
	parameter: SwaggerParameter,
	context: TestingContext,
): string | undefined {
	const name = parameter.name;
	if (!name) return undefined;

	if (
		parameter.in === "path" &&
		matchesOperation(operation, "POST", "/room/{code}/join") &&
		name === "code"
	) {
		return findInPool(context.valuePool, [
			"roomcode",
			"classkey",
			"classcode",
			"key",
		]);
	}

	if (
		parameter.in === "path" &&
		operation.apiPath.includes("/students/{userId}/") &&
		name === "userId"
	) {
		// Break approve/deny target the primary user because the prerequisite
		// break request is made by the primary actor (class owner).
		if (
			matchesOperation(operation, "POST", "/class/{id}/students/{userId}/break/approve") ||
			matchesOperation(operation, "POST", "/class/{id}/students/{userId}/break/deny")
		) {
			return String(context.me.id);
		}
		return context.secondaryUser.id;
	}

	if (
		parameter.in === "path" &&
		shouldTargetSecondaryUser(operation) &&
		name === "id"
	) {
		return context.secondaryUser.id;
	}

	if (
		parameter.in === "path" &&
		matchesOperation(operation, "PATCH", "/user/{email}/perm") &&
		name === "email"
	) {
		return context.secondaryUser.email;
	}

	if (
		parameter.in === "path" &&
		(operation.apiPath === "/notifications/{id}" ||
			operation.apiPath === "/notifications/{id}/mark-read") &&
		name === "id"
	) {
		return findInPool(context.valuePool, ["notificationid"]);
	}

	if (parameter.in === "query" && operation.apiPath === "/oauth/authorize") {
		switch (name) {
			case "response_type":
				return "code";
			case "client_id":
				return "autotest-client";
			case "redirect_uri":
				return "https://example.com/oauth/callback";
			case "scope":
				return "profile";
			case "state":
				return "autotest";
			default:
				return undefined;
		}
	}

	return undefined;
}

function getOperationBodyOverride(
	operation: SwaggerOperation,
	context: TestingContext,
): PreparedRequestBody | undefined {
	const contentType = operation.requestContentType ?? "application/json";
	if (contentType !== "application/json") return undefined;

	if (matchesOperation(operation, "POST", "/auth/register")) {
		return {
			contentType,
			value: {
				email: context.secondaryUser.email,
				password: context.secondaryUser.password,
				displayName: context.secondaryUser.displayName,
			},
		};
	}

	if (matchesOperation(operation, "POST", "/auth/login")) {
		return {
			contentType,
			value: {
				email: context.secondaryUser.email,
				password: context.secondaryUser.password,
			},
		};
	}

	if (matchesOperation(operation, "POST", "/class/create")) {
		return {
			contentType,
			value: {
				name: `${context.secondaryUser.displayName} Room`,
			},
		};
	}

	if (matchesOperation(operation, "PATCH", "/user/{id}/pin")) {
		return {
			contentType,
			value: { pin: AUTO_TEST_PIN },
		};
	}

	if (matchesOperation(operation, "POST", "/user/{id}/pin/verify")) {
		return {
			contentType,
			value: { pin: context.secondaryUser.pin ?? AUTO_TEST_PIN },
		};
	}

	if (matchesOperation(operation, "PATCH", "/user/{id}/perm")) {
		return {
			contentType,
			value: { perm: 3 },
		};
	}

	if (matchesOperation(operation, "POST", "/digipogs/award")) {
		return {
			contentType,
			value: {
				to: {
					id: context.secondaryUser.id,
					type: "user",
				},
				amount: 1,
				reason: "Automated test award",
			},
		};
	}

	if (matchesOperation(operation, "POST", "/digipogs/transfer")) {
		return {
			contentType,
			value: {
				to: String(context.me.id),
				amount: 1,
				pin: context.secondaryUser.pin ?? AUTO_TEST_PIN,
				reason: "Automated test transfer",
			},
		};
	}

	if (matchesOperation(operation, "POST", "/class/{id}/break/request")) {
		return {
			contentType,
			value: { reason: "Automated test break request" },
		};
	}

	if (matchesOperation(operation, "POST", "/class/{id}/help/request")) {
		return {
			contentType,
			value: { reason: "Automated test help request" },
		};
	}

	if (matchesOperation(operation, "POST", "/class/{id}/polls/create")) {
		return {
			contentType,
			value: {
				prompt: "Automated test poll",
				answers: ["Yes", "No"],
				blind: false,
				weight: 1,
				tags: ["autotest"],
				excludedRespondents: [],
				indeterminate: [],
				allowTextResponses: false,
				allowMultipleResponses: false,
			},
		};
	}

	if (matchesOperation(operation, "POST", "/class/{id}/polls/response")) {
		return {
			contentType,
			value: {
				response: ["Yes"],
				textRes: "",
			},
		};
	}

	if (matchesOperation(operation, "POST", "/oauth/token")) {
		return {
			contentType,
			value: {
				grant_type: "refresh_token",
				refresh_token: refreshToken,
			},
		};
	}

	if (matchesOperation(operation, "POST", "/oauth/revoke")) {
		return {
			contentType,
			value: {
				token: refreshToken,
				token_type_hint: "refresh_token",
			},
		};
	}

	return undefined;
}

// Resolves a parameter value using (in priority order):
//   1. Explicit swagger example/default on the parameter
//   2. Pool lookup – resource-scoped keys tried before the generic name,
//      so "classid" wins over "id" when the path is /class/{id}/…
//   3. Schema-driven synthesis
function resolveParameterValue(
	operation: SwaggerOperation,
	parameter: SwaggerParameter,
	spec: SwaggerSpec,
	context: TestingContext,
): string | null {
	const name = parameter.name;
	if (!name) return null;

	const override = getParameterOverrideValue(operation, parameter, context);
	if (override) return override;

	// For PATH parameters: consult the pool FIRST so real IDs harvested from
	// earlier responses (e.g. classId from POST /class/create) take priority
	// over any static Swagger example value (e.g. example: 42 in the spec).
	if (parameter.in === "path") {
		const norm = normalizeKey(name);
		const isIdParam = norm === "id" || norm.endsWith("id");
		const resourcePrefixed = operation.resourceNames.map(
			(r) => `${r}${name}`,
		);
		// For ID-typed path parameters only search resource-prefixed pool keys.
		// Falling back to the bare "id" would match the user's own id for
		// unrelated resources (e.g. room, notification), producing false 404s.
		const pooled = findInPool(
			context.valuePool,
			isIdParam ? resourcePrefixed : [...resourcePrefixed, name],
		);
		if (pooled) return pooled;

		// For ID-typed params, skip static swagger examples too – a hardcoded
		// example value is unlikely to exist in the live database.
		if (!isIdParam) {
			const seeded = stringifyParameterValue(getParameterSeedValue(parameter));
			if (seeded) return seeded;
		}

		// No real value available. For ID-typed path parameters return null so
		// the caller skips the test rather than firing it with a fabricated ID.
		if (isIdParam) return null;

		// Non-ID path params (e.g. a slug or enum segment): synthesise.
		const synthesized = buildValueFromSchema(parameter.schema, spec, {
			parameterMode: true,
			propertyName: name,
			valuePool: context.valuePool,
			currentUser: context.me,
		});
		return stringifyParameterValue(synthesized);
	}

	// Non-path parameters: original priority (swagger example → pool → synthesise).
	const seeded = stringifyParameterValue(getParameterSeedValue(parameter));
	if (seeded) return seeded;

	const resourcePrefixed = operation.resourceNames.map(
		(r) => `${r}${name}`,
	);
	const pooled = findInPool(context.valuePool, [...resourcePrefixed, name]);
	if (pooled) return pooled;

	const synthesized = buildValueFromSchema(parameter.schema, spec, {
		parameterMode: true,
		propertyName: name,
		valuePool: context.valuePool,
		currentUser: context.me,
	});
	return stringifyParameterValue(synthesized);
}

function buildRequestBody(
	operation: SwaggerOperation,
	spec: SwaggerSpec,
	context: TestingContext,
):
	| { status: "omit" }
	| { status: "ready"; body: PreparedRequestBody }
	| { status: "error"; reason: string } {
	const overrideBody = getOperationBodyOverride(operation, context);
	if (overrideBody) {
		harvestPool(context.valuePool, overrideBody.value);
		return {
			status: "ready",
			body: overrideBody,
		};
	}

	if (!operation.requestBody?.content) return { status: "omit" };
	if (!operation.requestContentType)
		return {
			status: "error",
			reason: "No usable content type in Swagger request body.",
		};

	const mediaType =
		operation.requestBody.content[operation.requestContentType];
	if (!mediaType)
		return {
			status: "error",
			reason: `Missing content for "${operation.requestContentType}".`,
		};

	const requestValue = getMediaTypeExample(mediaType, spec, {
		propertyName: singularize(operation.category),
		resourceNames: operation.resourceNames,
		valuePool: context.valuePool,
		currentUser: context.me,
	});

	if (requestValue === undefined) {
		return operation.requestBody.required
			? {
					status: "error",
					reason: "Unable to synthesize a request body from the Swagger schema.",
				}
			: { status: "omit" };
	}

	harvestPool(context.valuePool, requestValue);

	return {
		status: "ready",
		body: { contentType: operation.requestContentType, value: requestValue },
	};
}

function prepareRequest(
	operation: SwaggerOperation,
	spec: SwaggerSpec,
	context: TestingContext,
): RequestPreparationResult {
	const pathParameters = operation.parameters.filter((p) => p.in === "path");
	const queryParameters = operation.parameters.filter((p) => p.in === "query");
	const headerParameters = operation.parameters.filter(
		(p) => p.in === "header",
	);

	const resolvedPathParams: Record<string, string> = {};
	for (const parameter of pathParameters) {
		const value = resolveParameterValue(
			operation,
			parameter,
			spec,
			context,
		);
		if (!value || !parameter.name)
			return {
				ok: false,
				reason: `No value available for path parameter "${parameter.name}".`,
			};
		resolvedPathParams[parameter.name] = value;
	}

	let path = operation.apiPath.replace(/\{([^}]+)\}/g, (_, name: string) => {
		const value = resolvedPathParams[name];
		return value ? encodeURIComponent(value) : `{${name}}`;
	});

	const query = new URLSearchParams();
	for (const parameter of queryParameters) {
		const value = resolveParameterValue(
			operation,
			parameter,
			spec,
			context,
		);
		if (!value) {
			if (parameter.required)
				return {
					ok: false,
					reason: `No value for required query parameter "${parameter.name}".`,
				};
			continue;
		}
		if (parameter.name) query.set(parameter.name, value);
	}

	const headers: Record<string, string> = {};
	for (const parameter of headerParameters) {
		const value = resolveParameterValue(
			operation,
			parameter,
			spec,
			context,
		);
		if (!value) {
			if (parameter.required)
				return {
					ok: false,
					reason: `No value for required header parameter "${parameter.name}".`,
				};
			continue;
		}
		if (parameter.name) headers[parameter.name] = value;
	}

	const requestBody = buildRequestBody(operation, spec, context);
	if (requestBody.status === "error")
		return { ok: false, reason: requestBody.reason };

	const queryString = query.toString();
	if (queryString) path = `${path}?${queryString}`;

	return {
		ok: true,
		path,
		headers,
		body: requestBody.status === "ready" ? requestBody.body : undefined,
	};
}

// ─── API call ─────────────────────────────────────────────────────────────────

async function callApi(
	path: string,
	method: HttpMethod,
	options: {
		headers?: Record<string, string>;
		body?: PreparedRequestBody;
		authToken?: string;
		omitDefaultAuth?: boolean;
	} = {},
): Promise<ApiResponse> {
	const headers: Record<string, string> = { ...options.headers };
	if (options.authToken) {
		headers.Authorization = `Bearer ${options.authToken}`;
	} else if (!options.omitDefaultAuth && accessToken && !headers.Authorization) {
		headers.Authorization = `Bearer ${accessToken}`;
	}

	let body: BodyInit | undefined;
	if (options.body) {
		const { contentType, value } = options.body;
		if (contentType === "application/json") {
			headers["Content-Type"] = contentType;
			body = JSON.stringify(value);
		} else if (contentType === "application/x-www-form-urlencoded") {
			headers["Content-Type"] = contentType;
			const params = new URLSearchParams();
			if (isRecord(value)) {
				for (const [k, v] of Object.entries(value)) {
					if (v == null) continue;
					if (Array.isArray(v)) {
						for (const item of v) {
							if (item != null)
								params.append(
									k,
									typeof item === "string"
										? item
										: JSON.stringify(item),
								);
						}
					} else {
						params.set(
							k,
							typeof v === "string" ? v : JSON.stringify(v),
						);
					}
				}
			}
			body = params.toString();
		} else if (contentType === "text/plain") {
			headers["Content-Type"] = contentType;
			body =
				typeof value === "string" ? value : JSON.stringify(value);
		}
	}

	const response = await fetch(`${formbarUrl}/api/v1${path}`, {
		method,
		headers,
		body,
	});
	const rawText = await response.text();
	let responseBody: unknown = rawText;
	if (rawText) {
		try {
			responseBody = JSON.parse(rawText);
		} catch {
			responseBody = rawText;
		}
	}

	const bodySuccess =
		isRecord(responseBody) && typeof responseBody.success === "boolean"
			? responseBody.success
			: undefined;
	const hasStructuredError =
		isRecord(responseBody) &&
		("error" in responseBody ||
			("success" in responseBody && responseBody.success === false));

	const retryAfterHeader = response.headers.get("Retry-After");
	const retryAfterMs = retryAfterHeader
		? parseInt(retryAfterHeader, 10) * 1000
		: 60_000;

	return {
		ok: response.ok && bodySuccess !== false && !hasStructuredError,
		status: response.status,
		body: responseBody,
		rawText,
		isRateLimit: response.status === 429,
		retryAfterMs: response.status === 429 ? retryAfterMs : undefined,
	};
}

function getOperationCallOptions(
	operation: SwaggerOperation,
	context: TestingContext,
): {
	authToken?: string;
	omitDefaultAuth?: boolean;
} {
	switch (getOperationActor(operation)) {
		case "secondary":
			return {
				authToken: context.secondaryUser.accessToken,
				omitDefaultAuth: true,
			};
		case "public":
			return {
				omitDefaultAuth: true,
			};
		default:
			return {};
	}
}

async function runOperationPrerequisites(
	operation: SwaggerOperation,
	context: TestingContext,
): Promise<string | null> {
	if (
		matchesOperation(
			operation,
			"POST",
			"/class/{id}/students/{userId}/break/approve",
		) ||
		matchesOperation(operation, "POST", "/class/{id}/students/{userId}/break/deny")
	) {
		const classId = findInPool(context.valuePool, ["classid"]);
		if (!classId)
			return "A class ID is required for break approval tests.";

		// Use the primary actor (class owner / Manager) to create the break
		// request, since the secondary user joins as a Guest and lacks the
		// CLASS.BREAK.REQUEST scope required by this endpoint.
		const response = await callApi(`/class/${encodeURIComponent(classId)}/break/request`, "POST", {
			body: {
				contentType: "application/json",
				value: { reason: "Automated test break request" },
			},
		});
		if (!response.ok) {
			return `Failed to prepare a break request: ${summarizePayload(response.body)}`;
		}
	}

	return null;
}

function applyOperationResponseContext(
	operation: SwaggerOperation,
	response: ApiResponse,
	context: TestingContext,
) {
	if (!response.ok) return;

	const data = getResponseData<Record<string, unknown>>(response.body);
	if (!data) return;

	if (matchesOperation(operation, "POST", "/auth/register")) {
		const user = isRecord(data.user) ? data.user : null;
		if (user && user.id != null) {
			context.secondaryUser.id = String(user.id);
			addToPool(context.valuePool, "secondaryuserid", context.secondaryUser.id);
			addToPool(context.valuePool, "secondaryemail", context.secondaryUser.email);
		}
		return;
	}

	if (matchesOperation(operation, "POST", "/auth/login")) {
		if (typeof data.accessToken === "string") {
			context.secondaryUser.accessToken = data.accessToken;
		}
		if (typeof data.refreshToken === "string") {
			context.secondaryUser.refreshToken = data.refreshToken;
		}
		return;
	}

	if (matchesOperation(operation, "PATCH", "/user/{id}/pin")) {
		context.secondaryUser.pin = AUTO_TEST_PIN;
		return;
	}

	if (matchesOperation(operation, "POST", "/class/create")) {
		if (typeof data.key === "string") {
			setInPool(context.valuePool, "roomcode", data.key);
			setInPool(context.valuePool, "classkey", data.key);
		}
	}
}

// ─── Feature-disabled detection ─────────────────────────────────────────────
// Some endpoints are gated behind optional server features (Google OAuth,
// email, etc.).  When the feature is not configured the server returns a 403
// with a descriptive message.  These should be reported as "skipped", not
// "failed", because the endpoint itself is working correctly.

const FEATURE_DISABLED_PATTERNS: RegExp[] = [
	/not enabled on this server/i,
	/is not enabled/i,
	/is disabled on this server/i,
	/not configured on this server/i,
	/not available at this time/i,
];

function getFeatureDisabledReason(response: ApiResponse): string | null {
	if (
		response.status !== 403 &&
		response.status !== 501 &&
		response.status !== 503
	)
		return null;
	const text = summarizePayload(response.body);
	for (const pattern of FEATURE_DISABLED_PATTERNS) {
		if (pattern.test(text)) return `Feature not available: ${text}`;
	}
	return null;
}

function isClassScopedOperation(operation: SwaggerOperation): boolean {
	return (
		operation.apiPath.startsWith("/class/") ||
		operation.apiPath.startsWith("/room/")
	);
}

function getRuntimeOperationBlocker(
	operation: SwaggerOperation,
	context: TestingContext,
): string | null {
	const canCreateTemporaryClass = (context.me.permissions ?? 0) >= 4;
	const hasClassContext = Boolean(
		findInPool(context.valuePool, ["classid", "roomid"]),
	);
	const classContextUnavailableReason =
		"No active class is available. Creating a temporary class requires global Teacher permissions.";

	if (operation.apiPath === "/class/create" && operation.method === "POST") {
		return canCreateTemporaryClass
			? null
			: "Temporary class creation requires global Teacher permissions.";
	}

	if (!canCreateTemporaryClass) {
		if (operation.phase === "setup") {
			if (
				operation.apiPath === "/class/{id}/join" &&
				operation.method === "POST"
			) {
				return hasClassContext
					? "Using the current active class instead of creating and joining a temporary class."
					: classContextUnavailableReason;
			}
			if (
				operation.apiPath === "/class/{id}/start" &&
				operation.method === "POST"
			) {
				return hasClassContext
					? "Automatic class start is skipped when reusing the current class."
					: classContextUnavailableReason;
			}
		}

		if (operation.phase === "teardown" && isClassScopedOperation(operation)) {
			return hasClassContext
				? "Automatic teardown is skipped when reusing the current class."
				: "No temporary class was created for teardown.";
		}

		if (isClassScopedOperation(operation) && !hasClassContext) {
			return classContextUnavailableReason;
		}

		if (
			operation.phase === "main" &&
			isClassScopedOperation(operation) &&
			operation.method !== "GET"
		) {
			return "Class mutations are skipped unless the suite can create a temporary class.";
		}
	}

	if (
		matchesOperation(operation, "GET", "/oauth/authorize") &&
		operation.method === "GET"
	) {
		return "OAuth authorization redirects are skipped by the browser runner.";
	}

	if (matchesOperation(operation, "PATCH", "/user/pin/reset")) {
		return "PIN reset completion requires an emailed reset token that is not available to the suite.";
	}

	if (
		isSecondaryActorOperation(operation) &&
		!context.secondaryUser.accessToken
	) {
		return "Temporary user login did not complete.";
	}

	if (
		shouldTargetSecondaryUser(operation) &&
		!context.secondaryUser.id
	) {
		return "Temporary user registration did not complete.";
	}

	if (
		(operation.apiPath.includes("/students/{userId}/") ||
			matchesOperation(operation, "POST", "/digipogs/award")) &&
		!context.secondaryUser.id
	) {
		return "No temporary secondary user is available.";
	}

	if (
		matchesOperation(operation, "POST", "/room/{code}/join") &&
		!findInPool(context.valuePool, ["roomcode", "classkey", "key"])
	) {
		return "No room code is available for the temporary class.";
	}

	if (
		(matchesOperation(operation, "POST", "/user/{id}/pin/verify") ||
			matchesOperation(operation, "POST", "/digipogs/transfer")) &&
		!context.secondaryUser.pin
	) {
		return "Temporary user PIN setup did not complete.";
	}

	if (
		(operation.apiPath === "/notifications/{id}" ||
			operation.apiPath === "/notifications/{id}/mark-read") &&
		!findInPool(context.valuePool, ["notificationid"])
	) {
		return "No notification is available for lookup.";
	}

	if (
		(matchesOperation(operation, "POST", "/oauth/token") ||
			matchesOperation(operation, "POST", "/oauth/revoke")) &&
		!refreshToken
	) {
		return "No refresh token is available in the current browser session.";
	}

	return null;
}

// ─── Context loader ───────────────────────────────────────────────────────────

async function loadContext(valuePool: ValuePool): Promise<{
	context: TestingContext;
	meResult: ApiResponse;
}> {
	const meResult = await callApi("/user/me", "GET");
	const me = getResponseData<CurrentLoginData>(meResult.body);
	if (!meResult.ok || !me?.id)
		throw new Error(
			summarizePayload(meResult.body) || "Failed to load /user/me.",
		);

	harvestPool(valuePool, me);
	// Explicitly seed both "id" (generic) and "userid" so path params named
	// "id" on user routes resolve correctly without grabbing a classId.
	addToPool(valuePool, "userid", me.id);
	if (me.email) addToPool(valuePool, "email", me.email);

	// If user is already in a class, pre-seed classid so class-scoped endpoints
	// work even if class/create is missing from the spec.
	const activeClass = me.activeClass ?? me.classId;
	if (activeClass != null) {
		addToPool(valuePool, "classid", String(activeClass));
		// Room endpoints use the class ID as their {id} path param – keep in sync.
		addToPool(valuePool, "roomid", String(activeClass));
	}

	return {
		meResult,
		context: {
			me,
			valuePool,
			secondaryUser: createSecondaryUserContext(),
		},
	};
}

// ─── Swagger loader ───────────────────────────────────────────────────────────

async function loadSwaggerSpec(): Promise<{
	spec: SwaggerSpec;
	operations: SwaggerOperation[];
}> {
	const response = await fetch(`${formbarUrl}/docs/openapi.json`);
	if (!response.ok)
		throw new Error(
			`Swagger docs request failed with status ${response.status}.`,
		);
	const spec = (await response.json()) as SwaggerSpec;
	return { spec, operations: buildSwaggerOperations(spec) };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Testing() {
	const { settings } = useSettings();
	const [results, setResults] = useState<TestResult[]>([]);
	const [isRunning, setIsRunning] = useState(false);
	const [fatalError, setFatalError] = useState<string | null>(null);
	const [runStartedAt, setRunStartedAt] = useState<string | null>(null);
	const [swaggerOperations, setSwaggerOperations] = useState<
		SwaggerOperation[]
	>([]);
	const [swaggerError, setSwaggerError] = useState<string | null>(null);
	const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(
		null,
	);

	const updateResult = (
		key: string,
		updater: (result: TestResult) => TestResult,
	) => {
		setResults((current) =>
			current.map((r) => (r.key === key ? updater(r) : r)),
		);
	};

	const runSuite = async () => {
		if (!accessToken) {
			setFatalError(
				"No access token available. Please log in first.",
			);
			return;
		}

		setIsRunning(true);
		setFatalError(null);
		setRunStartedAt(new Date().toLocaleTimeString());
		setSwaggerError(null);
		setResults([]);
		setRateLimitMessage(null);

		try {
			const valuePool = createValuePool();
			const { spec, operations } = await loadSwaggerSpec();
			setSwaggerOperations(operations);

			const runnableOperations = operations.filter(
				(op) => !op.autoRunBlocker,
			);

			if (runnableOperations.length === 0) {
				setFatalError(
					"Swagger docs loaded, but no endpoints were eligible for automatic testing.",
				);
				return;
			}

			// Initialise result slots for all runnable ops.
			setResults(
				runnableOperations.map((op) => ({
					key: op.key,
					phase: op.phase,
					category: op.category,
					label: op.label,
					method: op.method,
					path: op.path,
					status: "pending",
					details: "",
				})),
			);

			// Load /user/me first to seed userId, email, and any active classId.
			const meOp = runnableOperations.find(
				(op) =>
					op.apiPath === "/user/me" && op.method === "GET",
			);
			if (meOp)
				updateResult(meOp.key, (r) => ({ ...r, status: "running" }));

			const meStart = performance.now();
			const { context, meResult } = await loadContext(valuePool);
			harvestPool(valuePool, meResult.body);

			if (meOp) {
				updateResult(meOp.key, (r) => ({
					...r,
					status: meResult.ok ? "passed" : "failed",
					statusCode: meResult.status,
					durationMs: Math.round(performance.now() - meStart),
					details: summarizePayload(meResult.body),
				}));
			}

			// Run all operations in phase order (setup → main → teardown).
			// Because operations are already sorted, iterating them in order
			// guarantees class/create and class/{id}/start finish before any
			// class-scoped test tries to use classId.
			for (const operation of runnableOperations) {
				if (
					operation.apiPath === "/user/me" &&
					operation.method === "GET"
				)
					continue;

				const runtimeBlocker = getRuntimeOperationBlocker(
					operation,
					context,
				);
				if (runtimeBlocker) {
					updateResult(operation.key, (r) => ({
						...r,
						status: "skipped",
						details: runtimeBlocker,
					}));
					continue;
				}

				const prerequisiteBlocker = await runOperationPrerequisites(
					operation,
					context,
				);
				if (prerequisiteBlocker) {
					updateResult(operation.key, (r) => ({
						...r,
						status: "skipped",
						details: prerequisiteBlocker,
					}));
					continue;
				}

				const prepared = prepareRequest(operation, spec, context);
				if (!prepared.ok) {
					updateResult(operation.key, (r) => ({
						...r,
						status: "skipped",
						details: prepared.reason,
					}));
					continue;
				}

				updateResult(operation.key, (r) => ({
					...r,
					path: prepared.path,
					status: "running",
					details: "",
				}));

				const start = performance.now();
				try {
					const callOptions = getOperationCallOptions(
						operation,
						context,
					);
					// Initial call – retried automatically on 429.
					let response: ApiResponse = await callApi(
						prepared.path,
						operation.method,
						{
							headers: prepared.headers,
							body: prepared.body,
							...callOptions,
						},
					);

					const MAX_RATE_LIMIT_RETRIES = 10;
					let rateLimitRetries = 0;

					while (
						response.isRateLimit &&
						rateLimitRetries < MAX_RATE_LIMIT_RETRIES
					) {
						const waitMs = response.retryAfterMs ?? 60_000;
						const waitSec = Math.ceil(waitMs / 1000);
						setRateLimitMessage(
							`Rate limited on ${operation.path}. Retrying in ${waitSec}s\u2026 (attempt ${rateLimitRetries + 1}/${MAX_RATE_LIMIT_RETRIES})`,
						);
						updateResult(operation.key, (r) => ({
							...r,
							status: "running",
							details: `Rate limited – waiting ${waitSec}s before retry`,
						}));
						await new Promise<void>((resolve) =>
							setTimeout(resolve, waitMs),
						);
						setRateLimitMessage(null);
						rateLimitRetries++;
						response = await callApi(
							prepared.path,
							operation.method,
							{
								headers: prepared.headers,
								body: prepared.body,
								...callOptions,
							},
						);
					}

					if (response.isRateLimit) {
						// Exhausted retries.
						setRateLimitMessage(null);
						updateResult(operation.key, (r) => ({
							...r,
							status: "failed",
							statusCode: response.status,
							durationMs: Math.round(performance.now() - start),
							details: `Rate limit exceeded after ${MAX_RATE_LIMIT_RETRIES} retries.`,
						}));
						continue;
					}

					if (response.ok) {
						if (operation.phase === "setup") {
							// For setup operations use priority harvest so that
							// freshly-created IDs (e.g. classId from POST
							// /class/create) replace any stale value that was
							// pre-seeded from /user/me.
							priorityHarvestPool(valuePool, response.body);
							const data = getResponseData<unknown>(response.body);
							if (data) priorityHarvestPool(valuePool, data);
							// Room endpoints use the class ID as their {id} path param – keep in sync.
							const latestClassId = findInPool(valuePool, ["classid"]);
							if (latestClassId) setInPool(valuePool, "roomid", latestClassId);
						} else {
							harvestPool(valuePool, response.body);
							const data = getResponseData<unknown>(response.body);
							if (data) harvestPool(valuePool, data);
						}
						applyOperationResponseContext(
							operation,
							response,
							context,
						);
					}

					// Detect feature-disabled responses (e.g. Google OAuth not configured).
					const skipReason = getFeatureDisabledReason(response);
					updateResult(operation.key, (r) => ({
						...r,
						status: skipReason
							? "skipped"
							: response.ok
								? "passed"
								: "failed",
						statusCode: response.status,
						durationMs: Math.round(performance.now() - start),
						details: skipReason ?? summarizePayload(response.body),
					}));

					// If a setup step failed, wipe dependent pool keys so that
					// downstream tests that need those resources are skipped.
					if (operation.phase === "setup" && !response.ok && !skipReason) {
						const toInvalidate =
							SETUP_FAILURE_INVALIDATES[
								`${operation.method}:${operation.apiPath}`
							];
						if (toInvalidate) {
							for (const key of toInvalidate)
								valuePool.delete(normalizeKey(key));
						}
					}
				} catch (error) {
					updateResult(operation.key, (r) => ({
						...r,
						status: "failed",
						durationMs: Math.round(performance.now() - start),
						details:
							error instanceof Error
								? error.message
								: "Request failed.",
					}));
				}
			}
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Unable to build the automatic Swagger test suite.";
			setSwaggerError(message);
			setFatalError(message);
		} finally {
			setIsRunning(false);
		}
	};

	const handleRunSuite = () => {
		void runSuite();
	};

	useEffect(() => {
		let cancelled = false;
		setSwaggerError(null);

		void loadSwaggerSpec()
			.then(({ operations }) => {
				if (cancelled) return;
				setSwaggerOperations(operations);
			})
			.catch((error) => {
				if (cancelled) return;
				setSwaggerOperations([]);
				setSwaggerError(
					error instanceof Error
						? error.message
						: "Unable to load the Swagger spec.",
				);
			});

		return () => {
			cancelled = true;
		};
	}, []);

	const passedCount = results.filter((r) => r.status === "passed").length;
	const failedCount = results.filter((r) => r.status === "failed").length;
	const skippedCount = results.filter((r) => r.status === "skipped").length;

	const setupResults = results.filter((r) => r.phase === "setup");
	const mainResults = results.filter((r) => r.phase === "main");
	const teardownResults = results.filter((r) => r.phase === "teardown");

	const unsupportedEndpoints = swaggerOperations
		.filter((op) => op.autoRunBlocker)
		.map<StaticIssue>((op) => ({
			key: op.key,
			category: op.category,
			method: op.method,
			path: op.path,
			reason: op.autoRunBlocker!,
		}));

	const resultColumns = [
		{
			title: "Category",
			dataIndex: "category",
			key: "category",
			width: 160,
		},
		{
			title: "Method",
			dataIndex: "method",
			key: "method",
			width: 90,
			render: (v: HttpMethod) => <Tag>{v}</Tag>,
		},
		{
			title: "Endpoint",
			key: "endpoint",
			render: (_: unknown, r: TestResult) => (
				<div>
					<div>{r.label}</div>
					<Typography.Text type="secondary">{r.path}</Typography.Text>
				</div>
			),
		},
		{
			title: "Status",
			dataIndex: "status",
			key: "status",
			width: 110,
			render: (v: TestStatus) => getStatusTag(v),
		},
		{ title: "Details", dataIndex: "details", key: "details" },
		{
			title: "Time",
			key: "durationMs",
			width: 90,
			render: (_: unknown, r: TestResult) =>
				r.durationMs != null ? `${r.durationMs} ms` : "--",
		},
	];

	return (
		<div
			style={{
				padding: "0 20px",
				height: "calc(100vh - 60px)",
				overflowY: "auto",
				overflowX: "hidden",
			}}
		>
			<FormbarHeader />
			<Flex
				vertical
				gap={16}
				style={{ padding: "16px 0 32px" }}
			>
				<Card
					style={{
						background: "#000a",
						...getAppearAnimation(settings.disableAnimations, 0),
					}}
				>
					<Flex justify="space-between" align="center" wrap gap={16}>
						<div>
							<Typography.Title level={2} style={{ margin: 0 }}>
								Endpoint Testing
							</Typography.Title>
							<Typography.Paragraph style={{ margin: "8px 0 0" }}>
								Builds a browser-side test suite from the
								Swagger spec. Click Run Suite to register a
								temporary user, create a temporary class, join
								and start it, exercise the eligible endpoints
								with the correct actor, then clean up during
								teardown.
							</Typography.Paragraph>
							<Typography.Text type="secondary">
								Last run: {runStartedAt ?? "Not run yet"}
							</Typography.Text>
						</div>
						<Button
							type="primary"
							onClick={handleRunSuite}
							loading={isRunning}
						>
							{runStartedAt ? "Run Suite Again" : "Run Suite"}
						</Button>
					</Flex>
				</Card>

				<Space
					wrap
					size={[12, 12]}
					style={getAppearAnimation(settings.disableAnimations, 1)}
				>
					<Tag color="green">Passed: {passedCount}</Tag>
					<Tag color="red">Failed: {failedCount}</Tag>
					<Tag color="orange">Skipped: {skippedCount}</Tag>
					<Tag color="blue">
						Excluded: {unsupportedEndpoints.length}
					</Tag>
					<Tag color="geekblue">
						Total endpoints: {swaggerOperations.length}
					</Tag>
				</Space>

				{fatalError && (
					<Alert
						type="error"
						showIcon
						message="Suite bootstrap failed"
						description={fatalError}
						style={getAppearAnimation(
							settings.disableAnimations,
							2,
						)}
					/>
				)}

				{swaggerError && (
					<Alert
						type="warning"
						showIcon
						message="Swagger docs unavailable"
						description={swaggerError}
						style={getAppearAnimation(
							settings.disableAnimations,
							3,
						)}
					/>
				)}

				{rateLimitMessage && (
					<Alert
						type="warning"
						showIcon
						message="Rate limited — waiting before retry"
						description={rateLimitMessage}
					/>
				)}

				<Alert
					type="info"
					showIcon
					message="Suite scope"
					description="The suite is generated from /docs/openapi.json at runtime. Setup operations run first in a fixed order (register temp user → verify → login → create class → join → start → join by room code) so later tests have real user and class context. DELETE endpoints are excluded unless they are part of managed teardown, and password-management endpoints remain excluded."
					style={getAppearAnimation(settings.disableAnimations, 4)}
				/>

				{setupResults.length > 0 && (
					<Card
						title="Setup"
						style={{
							background: "#000a",
							overflow: "hidden",
							...getAppearAnimation(
								settings.disableAnimations,
								5,
							),
						}}
					>
						<Table<TestResult>
							rowKey="key"
							size="small"
							pagination={false}
							dataSource={setupResults}
							columns={resultColumns}
						/>
					</Card>
				)}

				<Card
					title="Test Results"
					style={{
						background: "#000a",
						overflow: "hidden",
						...getAppearAnimation(settings.disableAnimations, 6),
					}}
				>
					<Table<TestResult>
						rowKey="key"
						size="small"
						pagination={false}
						dataSource={mainResults}
						columns={resultColumns}
					/>
				</Card>

				{teardownResults.length > 0 && (
					<Card
						title="Teardown"
						style={{
							background: "#000a",
							overflow: "hidden",
							...getAppearAnimation(
								settings.disableAnimations,
								7,
							),
						}}
					>
						<Table<TestResult>
							rowKey="key"
							size="small"
							pagination={false}
							dataSource={teardownResults}
							columns={resultColumns}
						/>
					</Card>
				)}

				<Card
					title="Excluded From Suite"
					style={{
						background: "#000a",
						overflow: "hidden",
						...getAppearAnimation(settings.disableAnimations, 8),
					}}
				>
					<Table<StaticIssue>
						rowKey="key"
						size="small"
						pagination={{ pageSize: 12 }}
						dataSource={unsupportedEndpoints}
						columns={[
							{
								title: "Category",
								dataIndex: "category",
								key: "category",
								width: 160,
							},
							{
								title: "Method",
								dataIndex: "method",
								key: "method",
								width: 90,
								render: (v: HttpMethod) => <Tag>{v}</Tag>,
							},
							{
								title: "Endpoint",
								dataIndex: "path",
								key: "path",
							},
							{
								title: "Reason",
								dataIndex: "reason",
								key: "reason",
							},
						]}
					/>
				</Card>
			</Flex>
		</div>
	);
}
