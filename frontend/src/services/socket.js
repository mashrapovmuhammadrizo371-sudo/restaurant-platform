import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined; // undefined = same-origin

let socketInstance = null;

// A single shared Socket.IO connection for the whole tab. Call connectSocket
// once a token is known (staff login or customer login) and disconnectSocket
// on logout. Rooms are joined server-side based on the JWT identity
// (see backend/src/services/socketService.js), so no client-side room
// management is needed beyond connecting with the right token.
export function connectSocket(token) {
  if (socketInstance) {
    socketInstance.disconnect();
  }
  socketInstance = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling']
  });
  return socketInstance;
}

export function getSocket() {
  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
