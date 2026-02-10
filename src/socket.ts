import { io, Socket } from "socket.io-client";
import Log from "./debugLogger";

//! ONLY UNTIL LOGIN IS IMPLEMENTED
export const prodUrl = "https://formbeta.yorktechapps.com";
export const formbarUrl = "http://localhost:420";

export let refreshToken: string;
export let accessToken: string;
export let socket: Socket;

type SocketEventHandlers = {
	onConnect?: () => void;
	onConnectError?: (err: any) => void;
	onDisconnect?: (reason: string) => void;
	onSetClass?: (classID: number) => void;
};

let eventHandlers: SocketEventHandlers = {};

export function registerSocketEventHandlers(handlers: SocketEventHandlers) {
	eventHandlers = handlers;
	attachEventHandlers();
}

function attachEventHandlers() {
	if (!socket) return;

	if (eventHandlers.onConnect) {
		socket.on("connect", eventHandlers.onConnect);
	}

	if (eventHandlers.onConnectError) {
		socket.on("connect_error", eventHandlers.onConnectError);
	}

	if (eventHandlers.onDisconnect) {
		socket.on("disconnect", eventHandlers.onDisconnect);
	}

	if (eventHandlers.onSetClass) {
		socket.on("setClass", eventHandlers.onSetClass);
	}
}

export function socketLogin(token: string) {
	fetch(`${formbarUrl}/api/v1/auth/refresh`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ token: token }),
	})
		.then(async (res) => {
			if (!res.ok) {
				// localStorage.removeItem('refreshToken');
				console.error(new Error("Failed to refresh token"));

				const loginResponse = await fetch(
					`${formbarUrl}/api/v1/auth/login`,
					{
						method: "POST",
						headers: { "Content-Type": "application/x-www-form-urlencoded" },
						body: localStorage.getItem("formbarLoginData")!,
					},
				);
				if (!loginResponse.ok) {
					const errorData = await loginResponse.json();
					throw new Error("Login failed", { cause: errorData });
				}
				const loginData = await loginResponse.json();
				const { data } = loginData;
				let { accessToken, refreshToken } = data;
				Log({ message: "Login successful", data: loginData });

				socketLogin(refreshToken);
				return;
			}
			return res.json();
		})
		.then((response) => {
			const { data } = response;
			const {
				accessToken: newAccessToken,
				refreshToken: newRefreshToken,
			} = data;
			Log({ message: "Token refreshed successfully", data });

			localStorage.setItem("refreshToken", newRefreshToken);
			refreshToken = newRefreshToken;
			accessToken = newAccessToken;

			socket = io(formbarUrl, {
				extraHeaders: {
					authorization: newAccessToken,
				},
				autoConnect: false,
				reconnectionAttempts: 5,
				reconnectionDelay: 2000,
			});

			attachEventHandlers(); // Attach handlers after socket is created
			socket.connect();
		})
		.catch((err) => {
			Log({
				message: "Error refreshing token",
				data: err,
				level: "error",
			});
		});
}
