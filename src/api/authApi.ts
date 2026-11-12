import CryptoJS from "crypto-js";
import { http } from "@api/HTTPApi";

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY;
const REFRESH_TOKEN_STORAGE_KEY = "refreshToken";
const GUEST_ACCESS_TOKEN_STORAGE_KEY = "guestAccessToken";

function encryptToken(token: string): string {
	return CryptoJS.AES.encrypt(token, SECRET_KEY).toString();
}

function decryptToken(encrypted: string): string {
	try {
		// Check if it looks like encrypted data (AES encrypted strings start with "U2FsdGVk")
		const isLikelyEncrypted = encrypted.startsWith("U2FsdGVk");

		if (!isLikelyEncrypted) {
			// Assume it's plaintext (migration from old storage)
			return encrypted;
		}

		const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY).toString(
			CryptoJS.enc.Utf8,
		);

		if (!decrypted) {
			console.error(
				"Decryption returned empty string - check SECRET_KEY",
			);
			return "";
		}

		return decrypted;
	} catch (e) {
		console.error("Failed to decrypt token:", e);
		return "";
	}
}

export function setRefreshToken(token: string) {
	localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, encryptToken(token));
	sessionStorage.removeItem(GUEST_ACCESS_TOKEN_STORAGE_KEY);
}

export function getRefreshToken(): string | null {
	const encrypted = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
	if (!encrypted) {
		return null;
	}

	const token = decryptToken(encrypted);
	if (!token) {
		localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
		return null;
	}

	return token;
}

export function setGuestAccessToken(token: string) {
	sessionStorage.setItem(GUEST_ACCESS_TOKEN_STORAGE_KEY, encryptToken(token));
	localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function getGuestAccessToken(): string | null {
	const encrypted = sessionStorage.getItem(GUEST_ACCESS_TOKEN_STORAGE_KEY);
	return encrypted ? decryptToken(encrypted) : null;
}

export function clearAuthTokens() {
	localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
	sessionStorage.removeItem(GUEST_ACCESS_TOKEN_STORAGE_KEY);
}

export function authLogin(email: string, password: string) {
	const body = new URLSearchParams({
		email,
		password,
		loginType: "login",
	});

	return http(
		"/auth/login",
		"POST",
		{
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body,
	);
}

export function guestLogin(displayName: string) {
	return http("/auth/guest", "POST", {}, { displayName });
}

export function refreshAuthToken(refreshToken: string) {
	return http("/auth/refresh", "POST", {}, { token: refreshToken });
}

export function registerUser(body: {
	email: string;
	password: string;
	displayName: string;
}) {
	return http("/auth/register", "POST", {}, body);
}
