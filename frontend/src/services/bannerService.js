import staffApi from './staffApi';
import api from './api';

export function getBanners(brandId) {
  return api.get('/banners', { params: { brand: brandId } });
}

function toFormData(data) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'imageFile') {
      if (value) formData.append('image', value);
    } else if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  return formData;
}

export function createBanner(data) {
  return staffApi.post('/banners', toFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export function updateBanner(id, data) {
  return staffApi.put(`/banners/${id}`, toFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export function deleteBanner(id) {
  return staffApi.delete(`/banners/${id}`);
}
