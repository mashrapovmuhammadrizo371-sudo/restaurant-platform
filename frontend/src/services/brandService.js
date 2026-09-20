import staffApi from './staffApi';
import api from './api';

// Brand listing/detail is public (optionalAuthenticate on the backend), so
// the customer app can browse brands without logging in. The staff panel
// uses the same read endpoints through the customer client on purpose —
// reads never need the staff token — and switches to staffApi only for
// the mutating boss/admin actions below.
export function getBrands() {
  return api.get('/brands');
}

export function getBrand(id) {
  return api.get(`/brands/${id}`);
}

function toFormData(data) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'logoFile') {
      if (value) formData.append('logo', value);
    } else if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  return formData;
}

export function createBrand(data) {
  return staffApi.post('/brands', toFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export function updateBrand(id, data) {
  return staffApi.put(`/brands/${id}`, toFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export function deleteBrand(id) {
  return staffApi.delete(`/brands/${id}`);
}
