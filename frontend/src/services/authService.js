import staffApi from './staffApi';

export function staffLogin(login, password) {
  return staffApi.post('/auth/staff/login', { login, password });
}

export function staffMe() {
  return staffApi.get('/auth/staff/me');
}
