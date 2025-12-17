import { io } from "socket.io-client";

const url = "http://localhost:420";

export const socket = io(url, {
    autoConnect: true,
    extraHeaders: {
        "api": "2826b3c26a55e30452d03cce0f68ad88388230eef042fa2cb3e396cc6adec184"
    }
});

// student api: a77fb53df61adfdbb2350c8a3114a80ae8e08fc15dd784b957b5949e67066499
// owner api: e046c05b520b2abead624e0e49de1cb8b1cc00f2b18f31e024b80498bd1ce580


// homeOwner api: 2826b3c26a55e30452d03cce0f68ad88388230eef042fa2cb3e396cc6adec184