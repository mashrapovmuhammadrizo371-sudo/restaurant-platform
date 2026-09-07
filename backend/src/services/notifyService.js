const { getIO } = require('./socketService');

function emit(room, event, payload) {
  const io = getIO();
  if (!io) return; // socket layer not initialized (e.g. in tests) — fail silently
  io.to(room).emit(event, payload);
}

const notify = {
  newOrderToOperators(brandId, order) {
    emit(`brand:${brandId}:operators`, 'order:new', order);
  },
  orderAssignedToCourier(courierId, order) {
    emit(`courier:${courierId}`, 'order:assigned', order);
  },
  orderStatusToCustomer(customerId, order) {
    emit(`customer:${customerId}`, 'order:status', order);
  },
  tableOrderToOfitsiant(brandId, order) {
    emit(`brand:${brandId}:ofitsiant`, 'table_order:update', order);
  }
};

module.exports = notify;
