import type { ClassData, CurrentUserData, ScopeKey, Student } from "@/types";

function unique(items: string[]) {
	return Array.from(new Set(items));
}

function normalizeScopes(scopes: string | string[] | undefined): string[] {
	if (!scopes) return [];
	return Array.isArray(scopes) ? scopes : [scopes];
}

function getStudentClassScopes(student: Student | null | undefined, classData: ClassData | null | undefined): string[] {
	if (!student || !classData) return [];

	// Class permissions are legacy data for older integrations; the app uses
	// explicit role assignments in roles.class as the source of truth.
	const roleIdSet = new Set((student.roles?.class || []).map((role) => Number(role.id)));
	const scopes = (classData.roles || [])
		.filter((role) => roleIdSet.has(Number(role.id)))
		.flatMap((role) => role.scopes || []);

	if (student.scopes?.class?.length) {
		scopes.push(...student.scopes.class);
	}

	return unique(scopes);
}

export function getStudentClassScopeCount(student: Student | null | undefined, classData: ClassData | null | undefined): number {
	if (!student) return 0;

	const roleScopeCount = getStudentClassScopes(student, classData).length;
	if (roleScopeCount > 0) {
		return roleScopeCount;
	}

	return 0;
}

export function getStudentScopeCount(student: Student | null | undefined, classData: ClassData | null | undefined): number {
	if (!student) return 0;

	const scopes = [
		...(student.roles?.global || []).flatMap((role) => normalizeScopes(role.scopes)),
		...(student.roles?.class || []).flatMap((role) => normalizeScopes(role.scopes)),
		...(student.scopes?.global || []),
		...getStudentClassScopes(student, classData),
	];

	return unique(scopes).length;
}

export function currentUserHasScope(userData: CurrentUserData | null | undefined, scopeKey: ScopeKey): boolean {
	if (!userData) return false;
	if (userData.scopes?.global?.includes("global.system.admin")) return true; // Admin override for all scopes.

	const isGlobalScope = userData.scopes?.global?.includes(scopeKey);
	const isClassScope = userData.scopes?.class?.includes(scopeKey);

	return (isClassScope || isGlobalScope) ?? false;
}

export function userHasAllScopes(userData: CurrentUserData | null | undefined, scopeKeys: ScopeKey[]): boolean {
	if (!userData) return false;
	return scopeKeys.every((scopeKey) => currentUserHasScope(userData, scopeKey));
}

export function userHasAnyScope(userData: CurrentUserData | null | undefined, scopeKeys: ScopeKey[]): boolean {
	if (!userData) return false;
	return scopeKeys.some((scopeKey) => currentUserHasScope(userData, scopeKey));
}
