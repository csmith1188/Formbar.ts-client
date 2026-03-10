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
import { useEffect, useRef, useState } from "react";
import FormbarHeader from "../components/FormbarHeader";
import { getAppearAnimation, useSettings, useUserData } from "../main";
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

type TestingContext = {
	me: CurrentLoginData;
	valuePool: ValuePool;
};

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
const AUTO_TEST_DISPLAY_NAME = "Auto Test User";

// Setup operations run first (in this order) before the main test suite.
// They establish class state so class-scoped endpoints have real IDs to use.
// Matched by method + normalised apiPath against whatever the Swagger spec exposes.
const SETUP_API_PATHS: Array<{ method: HttpMethod; apiPath: string }> = [
	{ method: "POST", apiPath: "/class/create" },
	{ method: "POST", apiPath: "/class/{id}/start" },
	{ method: "POST", apiPath: "/class/{id}/join" },
];

// Teardown operations run last to clean up test state.
const TEARDOWN_API_PATHS: Array<{ method: HttpMethod; apiPath: string }> = [
	{ method: "POST", apiPath: "/class/{id}/end" },
];

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

function harvestPool(pool: ValuePool, value: unknown, keyHint?: string) {
	if (value == null || typeof value === "function") return;
	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		if (keyHint) addToPool(pool, keyHint, value);
		return;
	}
	if (Array.isArray(value)) {
		for (const item of value)
			harvestPool(
				pool,
				item,
				keyHint ? singularize(keyHint) : undefined,
			);
		return;
	}
	if (isRecord(value)) {
		for (const [k, v] of Object.entries(value)) {
			harvestPool(pool, v, k);
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

function getAutoRunBlocker(
	operation: Pick<
		SwaggerOperation,
		"apiPath" | "method" | "security" | "parameters" | "requestContentType"
	>,
): string | null {
	if (operation.method === "DELETE")
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
		return a.path.length - b.path.length || a.path.localeCompare(b.path);
	});
}

// ─── Request preparation ──────────────────────────────────────────────────────

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

	const seeded = stringifyParameterValue(getParameterSeedValue(parameter));
	if (seeded) return seeded;

	// Build lookup names: resource-prefixed variants first, then the bare name.
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
	} = {},
): Promise<ApiResponse> {
	const headers: Record<string, string> = { ...options.headers };
	if (accessToken && !headers.Authorization)
		headers.Authorization = `Bearer ${accessToken}`;

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

	return {
		ok: response.ok && bodySuccess !== false && !hasStructuredError,
		status: response.status,
		body: responseBody,
		rawText,
	};
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
	}

	return { meResult, context: { me, valuePool } };
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
	const { userData } = useUserData();
	const autoRunKeyRef = useRef<string | null>(null);
	const runSuiteRef = useRef<() => Promise<void>>(async () => {});
	const [results, setResults] = useState<TestResult[]>([]);
	const [isRunning, setIsRunning] = useState(false);
	const [fatalError, setFatalError] = useState<string | null>(null);
	const [runStartedAt, setRunStartedAt] = useState<string | null>(null);
	const [swaggerOperations, setSwaggerOperations] = useState<
		SwaggerOperation[]
	>([]);
	const [swaggerError, setSwaggerError] = useState<string | null>(null);

	const updateResult = (
		key: string,
		updater: (result: TestResult) => TestResult,
	) => {
		setResults((current) =>
			current.map((r) => (r.key === key ? updater(r) : r)),
		);
	};

	runSuiteRef.current = async () => {
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
					const response = await callApi(
						prepared.path,
						operation.method,
						{
							headers: prepared.headers,
							body: prepared.body,
						},
					);

					if (response.ok) {
						// Harvest all scalar values from the response into the pool.
						harvestPool(valuePool, response.body);
						// Also harvest data-field values keyed by resource name so
						// later endpoints can find e.g. "classid" from a create response.
						const data = getResponseData<unknown>(response.body);
						if (data) harvestPool(valuePool, data);
					}

					updateResult(operation.key, (r) => ({
						...r,
						status: response.ok ? "passed" : "failed",
						statusCode: response.status,
						durationMs: Math.round(performance.now() - start),
						details: summarizePayload(response.body),
					}));
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
		void runSuiteRef.current();
	};

	useEffect(() => {
		if (!userData?.id) return;
		const nextKey = String(userData.id);
		if (autoRunKeyRef.current === nextKey) return;
		autoRunKeyRef.current = nextKey;
		void runSuiteRef.current();
	}, [userData?.id]);

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
								Automatically tests all API endpoints from the
								Swagger spec. Setup operations (class create /
								start / join) run first to establish class
								state, then main endpoints, then teardown.
								Values harvested from each response are fed
								forward into subsequent requests.
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
							Run Suite Again
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
						Not auto-run: {unsupportedEndpoints.length}
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

				<Alert
					type="info"
					showIcon
					message="Auto-run scope"
					description="The suite is generated from /docs/openapi.json at runtime. Setup operations run first in a fixed order (class create → start → join) so subsequent tests have a real class to work with. DELETE endpoints and password-management endpoints are always excluded."
					style={getAppearAnimation(settings.disableAnimations, 4)}
				/>

				{setupResults.length > 0 && (
					<Card
						title="Setup"
						style={{
							background: "#000a",
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
					title="Not Auto-Run"
					style={{
						background: "#000a",
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