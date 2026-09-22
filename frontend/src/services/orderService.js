import staffApi from './staffApi';
import api from './api';

// -- Customer side --
export function createOrder(data) {
  return api.post('/orders', data);
}

export function getMyOrders() {
  return api.get('/customers/me/orders');
}

// -- Staff side --
export function getOrders(params) {
  return staffApi.get('/orders', { params });
}

export function getOrder(id) {
  return staffApi.get(`/orders/${id}`);
}

export function createStaffTableOrder(data) {
  return staffApi.post('/orders/table', data);
}

export function acceptOrder(id) {
  return staffApi.put(`/orders/${id}/accept`);
}

export function rejectOrder(id) {
  return staffApi.put(`/orders/${id}/reject`);
}

export function assignCourier(id, courierId) {
  return staffApi.put(`/orders/${id}/assign-courier`, { courierId });
}

export function assignWaiter(id, waiterId) {
  return staffApi.put(`/orders/${id}/assign-waiter`, { waiterId });
}

export function startDelivery(id) {
  return staffApi.put(`/orders/${id}/deliver-start`);
}

export function completeDelivery(id) {
  return staffApi.put(`/orders/${id}/deliver-complete`);
}

export function updateTableOrderStatus(id, status) {
  return staffApi.put(`/orders/${id}/table-status`, { status });
}

export function markOrderPaid(id) {
  return staffApi.put(`/orders/${id}/mark-paid`);
}
