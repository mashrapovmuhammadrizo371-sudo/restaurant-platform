const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

let io = null;

// Rooms used:
//   brand:<brandId>:operators   — new order alerts for that brand's operators
//                                 AND cashiers (Kassir now also dispatches
//                                 new orders — see orderRoutes.js — so it
//                                 joins the same room rather than a
//                                 duplicate one)
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
      return;
    }

    if (principal.type === 'staff') {
      if (principal.role === 'courier') socket.join(`courier:${principal.sub}`);

      // Load the staff member server-side and join ONLY the brand rooms
      // they are actually assigned to. This makes new-order delivery
      // reliable even if the frontend emits watch:brand before the socket
      // has fully connected/reconnected.
      User.findById(principal.sub).select('role brands isActive').lean()
        .then(user => {
          if (!user || !user.isActive) return;
          const brandIds = (user.brands || []).map(id => String(id));
          if (user.role === 'boss') return;
          if (user.role === 'operator' || user.role === 'cashier') {
            brandIds.forEach(brandId => socket.join(`brand:${brandId}:operators`));
          }
          if (user.role === 'ofitsiant') {
            brandIds.forEach(brandId => socket.join(`brand:${brandId}:ofitsiant`));
          }
        })
        .catch(() => {});

      // Keep the explicit watch event for compatibility with the existing
      // frontend; the server-side join above is the authoritative path.
      socket.on('watch:brand', brandId => {
        const id = String(brandId || '');
        if (!id) return;
        if (principal.role === 'operator' || principal.role === 'cashier') {
          socket.join(`brand:${id}:operators`);
        }
        if (principal.role === 'ofitsiant') socket.join(`brand:${id}:ofitsiant`);
      });
    }
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
