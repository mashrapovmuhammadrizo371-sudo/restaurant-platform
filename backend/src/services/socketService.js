const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwt');

let io = null;

// Rooms used:
//   brand:<brandId>:operators   — new order alerts for that brand's operators
//   courier:<userId>            — assignment alerts for one courier
//   customer:<customerId>       — order status updates for one customer
//   brand:<brandId>:ofitsiant   — table order updates for waiters of that brand

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || '*' }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(); // allow anonymous connections (customer w/o login browsing)
      const decoded = verifyToken(token);
      socket.data.principal = decoded;
      next();
    } catch (err) {
      next(); // treat as anonymous rather than hard-failing the socket
    }
  });

  io.on('connection', socket => {
    const principal = socket.data.principal;
    if (!principal) return;

    if (principal.type === 'customer') {
      socket.join(`customer:${principal.sub}`);
    }
    if (principal.type === 'staff') {
      if (principal.role === 'courier') socket.join(`courier:${principal.sub}`);
      // Operators/ofitsiants join brand rooms explicitly via a "watch" event,
      // since one staff account may manage multiple brands.
      socket.on('watch:brand', brandId => {
        if (principal.role === 'operator') socket.join(`brand:${brandId}:operators`);
        if (principal.role === 'ofitsiant') socket.join(`brand:${brandId}:ofitsiant`);
      });
    }
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
