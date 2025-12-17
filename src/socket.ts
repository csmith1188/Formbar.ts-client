import { io } from "socket.io-client";

//! ONLY UNTIL LOGIN IS IMPLEMENTED
export const url = "";
export const api = "";


export const socket = io(url, {
    autoConnect: true,
    extraHeaders: {
        "api": api
    }
});

// student api: a77fb53df61adfdbb2350c8a3114a80ae8e08fc15dd784b957b5949e67066499
// owner api: e046c05b520b2abead624e0e49de1cb8b1cc00f2b18f31e024b80498bd1ce580


// homeOwner api: b8e3d5588354ec9c2449bf3b8787178dedd6b2ae42ae973421477ba2f71dcb61