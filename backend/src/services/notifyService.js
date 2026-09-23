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

    // Cashier is the central order hub, so every active cashier receives
    // the new-order event regardless of which brand the order belongs to.
    // Operators remain brand-scoped through the operator room below.
    User.find({ role: 'cashier', isActive: true }).select('_id').lean()
      .then(cashiers => {
        cashiers.forEach(user => emit(`staff:${user._id}`, 'order:new', order));
      })
      .catch(() => {});

    // Keep operators brand-scoped as before.
    User.find({
      role: 'operator',
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
