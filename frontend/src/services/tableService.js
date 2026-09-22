import staffApi from './staffApi';
import api from './api';

export function getTables(brandId) {
  return api.get('/tables', { params: { brand: brandId } });
}

export function getStaffTables(brandId) {
  return staffApi.get('/tables', { params: { brand: brandId } });
}

export function createTable(data) {
  return staffApi.post('/tables', data);
}

export function updateTable(id, data) {
  return staffApi.put(`/tables/${id}`, data);
}

export function deleteTable(id) {
  return staffApi.delete(`/tables/${id}`);
}

// Waiter-only (see backend tableController.setTableStatus) — marks a
// table busy/free without needing the admin tables.manage permission.
export function setTableStatus(id, status) {
  return staffApi.put(`/tables/${id}/status`, { status });
}
