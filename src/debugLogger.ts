import { isDev } from "./main";

type LogProps = {
	message: string;
	data?: any;
	level?: "info" | "warn" | "error" | "debug";
	allowedInProd?: boolean;
};

function getCallerLocation(): string {
	const err = new Error();
	const stack = err.stack?.split("\n");
	// Stack: [0] Error, [1] getCallerLocation, [2] Log, [3] actual caller
	const callerLine = stack?.[3];
	if (!callerLine) return "";

	// Extract file path from stack trace
	const match = callerLine.match(/(?:at\s+)?(?:.*?\s+\()?(.+):\d+:\d+\)?$/);
	if (match) {
		let fileName = match[1].split("/").pop()?.split("\\").pop() || match[1];
		// Remove Vite's cache-busting query params (e.g., ?t=1234567890)
		fileName = fileName.replace(/\?.*$/, "");
		return fileName;
	}
	return "";
}

export default function Log({
	message,
	data = null,
	level = "info",
	allowedInProd = false,
}: LogProps) {
	if (!isDev && !allowedInProd) return;

	const location = getCallerLocation();
	const prefix = `[${level.toUpperCase()}]:`;
	const suffix = `${location ? ` | [at ${location}]` : ""}`;

	const logFn =
		level === "error"
			? console.error
			: level === "warn"
				? console.warn
				: level === "debug"
					? console.debug
					: console.log;

	const dataStr =
		typeof data !== "object" && data !== null ? ` | ${data}` : "";

	if (typeof data === "object" && data !== null) {
		logFn(prefix, message, data, suffix);
	} else {
		logFn(prefix, `${message}${dataStr}${suffix}`);
	}

	return null;
}
