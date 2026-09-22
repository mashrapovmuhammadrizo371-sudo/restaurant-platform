import staffApi from './staffApi';

export function getWaiters(params) {
  return staffApi.get('/waiters', { params });
}
