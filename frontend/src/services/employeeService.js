import staffApi from './staffApi';

export function getEmployees(params) {
  return staffApi.get('/employees', { params });
}

export function createEmployee(data) {
  return staffApi.post('/employees', data);
}

export function updateEmployee(id, data) {
  return staffApi.put(`/employees/${id}`, data);
}

export function resetEmployeePassword(id, newPassword) {
  return staffApi.put(`/employees/${id}/password`, { newPassword });
}

export function deleteEmployee(id) {
  return staffApi.delete(`/employees/${id}`);
}
