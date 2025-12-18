import { io, Socket } from "socket.io-client";

//! ONLY UNTIL LOGIN IS IMPLEMENTED
export const prodUrl = "https://formbeta.yorktechapps.com"

export let connectionUrl: string;
export let connectionAPI: string;
export let socket: Socket;

type SocketEventHandlers = {
	onConnect?: () => void;
	onConnectError?: (err: any) => void;
	onDisconnect?: (reason: string) => void;
	onSetClass?: (classID: number) => void;
}

let eventHandlers: SocketEventHandlers = {};

export function registerSocketEventHandlers(handlers: SocketEventHandlers) {
	eventHandlers = handlers;
	attachEventHandlers();
}

function attachEventHandlers() {
	if (!socket) return;

	if (eventHandlers.onConnect) {
		socket.on('connect', eventHandlers.onConnect);
	}

	if (eventHandlers.onConnectError) {
		socket.on('connect_error', eventHandlers.onConnectError);
	}

	if (eventHandlers.onDisconnect) {
		socket.on('disconnect', eventHandlers.onDisconnect);
	}

	if (eventHandlers.onSetClass) {
		socket.on('setClass', eventHandlers.onSetClass);
	}
}

export function loginSocket(url: string, api: string) {
	socket = io(url, {
		autoConnect: true,
		extraHeaders: {
			"api": api
		}
	});

    connectionUrl = url;
    connectionAPI = api;

    //? Save user connection info to local storage for persistence
    localStorage.setItem('connectionUrl', url);
    localStorage.setItem('connectionAPI', api);

	attachEventHandlers();
};

// student api: a77fb53df61adfdbb2350c8a3114a80ae8e08fc15dd784b957b5949e67066499
// owner api: e046c05b520b2abead624e0e49de1cb8b1cc00f2b18f31e024b80498bd1ce580


// homeOwner api: 96849bd05e533f09fe4f5bfef8fac188d2eb9db2585dd3a175b98022844dab65