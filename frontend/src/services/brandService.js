import staffApi from './staffApi';
import api from './api';

// Public brand listing/detail (optionalAuthenticate on the backend), used
// by the customer app so it can browse brands without logging in.
export function getBrands() {
  return api.get('/brands');
}

export function getBrand(id) {
  return api.get(`/brands/${id}`);
}

// Staff-scoped brand listing. IMPORTANT: this must go through staffApi,
// not the plain getBrands() above — the backend's listBrands only scopes
// results to the caller's assigned brands when it recognizes the request
// as staff-authenticated (req.principalType === 'staff', set from a valid
// staffToken). Calling it with the customer client instead (as every
// admin page originally did) makes the backend treat it as a public/
// customer request, which returns EVERY active brand regardless of the
// admin's actual assignment — a real data-scoping leak for any non-boss
// Admin. Use this in every admin/staff page instead of getBrands().
export function getStaffBrands() {
  return staffApi.get('/brands');
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
