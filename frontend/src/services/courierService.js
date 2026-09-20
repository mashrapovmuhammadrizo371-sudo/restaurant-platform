import staffApi from './staffApi';

export function getCouriers(params) {
  return staffApi.get('/couriers', { params });
}

export function setMyAvailability(availability) {
  return staffApi.put('/couriers/me/availability', { availability });
}
