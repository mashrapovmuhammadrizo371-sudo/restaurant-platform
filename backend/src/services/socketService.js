const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

let io = null;

// Rooms used:
//   brand:<brandId>:operators   — new order alerts for operators
//   brand:<brandId>:ofitsiant   — table order updates for waiters of that brand
//   staff:<userId>              — direct staff notifications
//   courier:<userId>            — assignment alerts for one courier
//   customer:<customerId>       — order status updates for one customer

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || '*' }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next();
      const decoded = verifyToken(token);
      socket.data.principal = decoded;
      next();
    } catch (err) {
      next();
    }
  });

  io.on('connection', socket => {
    const principal = socket.data.principal;
    if (!principal) return;

    if (principal.type === 'customer') {
      socket.join(`customer:${principal.sub}`);
      return;
    }

    if (principal.type === 'staff') {
      // Every staff member gets a private room. This is the authoritative
      // path for cashier/waiter/courier assignment notifications.
      socket.join(`staff:${principal.sub}`);

      if (principal.role === 'courier') {
        socket.join(`courier:${principal.sub}`);
      }

      User.findById(principal.sub).select('role brands isActive').lean()
        .then(user => {
          if (!user || !user.isActive) return;
          const brandIds = (user.brands || []).map(id => String(id));

          if (user.role === 'operator' || user.role === 'cashier') {
            brandIds.forEach(brandId => socket.join(`brand:${brandId}:operators`));
          }
          if (user.role === 'ofitsiant') {
            brandIds.forEach(brandId => socket.join(`brand:${brandId}:ofitsiant`));
          }
        })
        .catch(() => {});

      socket.on('watch:brand', brandId => {
        const id = String(brandId || '');
        if (!id) return;
        if (principal.role === 'operator' || principal.role === 'cashier') {
          socket.join(`brand:${id}:operators`);
        }
        if (principal.role === 'ofitsiant') {
          socket.join(`brand:${id}:ofitsiant`);
        }
      });
    }
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
