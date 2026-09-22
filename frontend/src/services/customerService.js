import staffApi from './staffApi';
import api from './api';

// -- Customer's own profile --
export function updateMyProfile(data) {
  return api.put('/customers/me', data);
}

export function addMyAddress(data) {
  return api.post('/customers/me/addresses', data);
}

export function deleteMyAddress(addressId) {
  return api.delete(`/customers/me/addresses/${addressId}`);
}

// -- Public --
export function getLeaderboard(limit = 20) {
  return api.get('/customers/leaderboard', { params: { limit } });
}

// -- Staff (admin customer management) --
export function getCustomers(search) {
  return staffApi.get('/customers', { params: { search } });
}

export function getCustomer(id) {
  return staffApi.get(`/customers/${id}`);
}


export function updateCustomerStatus(id, isActive) {
  return staffApi.patch(`/customers/${id}/status`, { isActive });
}

export function updateCustomer(id, data) {
  return staffApi.put(`/customers/${id}`, data);
}

export function deleteCustomer(id) {
  return staffApi.delete(`/customers/${id}`);
}
