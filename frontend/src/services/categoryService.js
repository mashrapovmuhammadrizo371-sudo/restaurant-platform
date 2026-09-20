import staffApi from './staffApi';
import api from './api';

export function getCategories(brandId) {
  return api.get('/categories', { params: { brand: brandId } });
}

export function createCategory(data) {
  return staffApi.post('/categories', data);
}

export function updateCategory(id, data) {
  return staffApi.put(`/categories/${id}`, data);
}

export function deleteCategory(id) {
  return staffApi.delete(`/categories/${id}`);
}
