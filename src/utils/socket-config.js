import io from "socket.io-client";
import { generateNewSession } from "@/httpServices/sessionId";

// const SOCKET_URL = 'http://ec2-54-224-251-106.compute-1.amazonaws.com:2087'; // Replace with your server URL
const SOCKET_URL = "https://bianca-nera.com:2087"; // Replace with your server URL
const socket = io(SOCKET_URL, {
  transports: ["websocket"], // Use WebSocket first
  jsonp: false,
  auth: {
    token: localStorage.getItem("authToken") || "",
    sessionId: generateNewSession() || "",
  },
});

// Log the socket ID when connected
socket.on("connect", () => {
  console.log(`Socket connected with ID: ${socket.id}`);
});

export default socket;
