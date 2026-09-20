import staffApi from './staffApi';
import api from './api';

export function validatePromoCode(brand, code, orderTotal) {
  return api.post('/promocodes/validate', { brand, code, orderTotal });
}

export function getPromoCodes(brandId) {
  return staffApi.get('/promocodes', { params: { brand: brandId } });
}

export function createPromoCode(data) {
  return staffApi.post('/promocodes', data);
}

export function updatePromoCode(id, data) {
  return staffApi.put(`/promocodes/${id}`, data);
}

export function deletePromoCode(id) {
  return staffApi.delete(`/promocodes/${id}`);
}
