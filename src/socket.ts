import { io } from "socket.io-client";

//! ONLY UNTIL LOGIN IS IMPLEMENTED
export const url = "http://127.0.0.1:420";
export const api = "96849bd05e533f09fe4f5bfef8fac188d2eb9db2585dd3a175b98022844dab65";


export const socket = io(url, {
    autoConnect: true,
    extraHeaders: {
        "api": api
    }
});

// student api: a77fb53df61adfdbb2350c8a3114a80ae8e08fc15dd784b957b5949e67066499
// owner api: e046c05b520b2abead624e0e49de1cb8b1cc00f2b18f31e024b80498bd1ce580


// homeOwner api: 96849bd05e533f09fe4f5bfef8fac188d2eb9db2585dd3a175b98022844dab65