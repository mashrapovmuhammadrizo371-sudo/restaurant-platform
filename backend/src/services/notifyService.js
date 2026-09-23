const { getIO } = require('./socketService');
const User = require('../models/User');

function emit(room, event, payload) {
  const io = getIO();
  if (!io) return;
  io.to(room).emit(event, payload);
}

const notify = {
  newOrderToOperators(brandId, order) {
    emit(`brand:${brandId}:operators`, 'order:new', order);

    // Direct fallback for cashiers/operators assigned to this brand.
    // This does not depend on the frontend's brand-watch event.
    User.find({
      role: { $in: ['cashier', 'operator'] },
      brands: brandId,
      isActive: true
    }).select('_id').lean()
      .then(users => {
        users.forEach(user => emit(`staff:${user._id}`, 'order:new', order));
      })
      .catch(() => {});
  },

  orderAssignedToCourier(courierId, order) {
    emit(`courier:${courierId}`, 'order:assigned', order);
    emit(`staff:${courierId}`, 'order:assigned', order);
  },

  orderStatusToCustomer(customerId, order) {
    emit(`customer:${customerId}`, 'order:status', order);
  },

  tableOrderToOfitsiant(brandId, order) {
    emit(`brand:${brandId}:ofitsiant`, 'table_order:update', order);

    // Direct notification to the waiter assigned to this order.
    if (order.ofitsiant) {
      emit(`staff:${order.ofitsiant}`, 'table_order:update', order);
    }
  }
};

module.exports = notify;
