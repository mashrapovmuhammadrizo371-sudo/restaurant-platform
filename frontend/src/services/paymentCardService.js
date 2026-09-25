import api from './api';
import staffApi from './staffApi';

export function getPublicPaymentCard() {
  return api.get('/payment-card/public');
}

export function getAdminPaymentCard() {
  return staffApi.get('/payment-card');
}

export function saveAdminPaymentCard(data) {
  return staffApi.put('/payment-card', data);
}
