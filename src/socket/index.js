import { io } from "socket.io-client";

const options = {
    "force new connection": true,
    reconnectionAttempts: "Infinity",
    timeout: 10000,
    transports: ["websocket"]
}

const socket = io('http://university-ecosystem.ru/video-api', options);

export default socket;