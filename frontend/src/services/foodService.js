import staffApi from './staffApi';
import api from './api';

export function getFoods(params) {
  return api.get('/foods', { params });
}

export function getFood(id) {
  return api.get(`/foods/${id}`);
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

export function createFood(data) {
  return staffApi.post('/foods', toFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export function updateFood(id, data) {
  return staffApi.put(`/foods/${id}`, toFormData(data), {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export function deleteFood(id) {
  return staffApi.delete(`/foods/${id}`);
}
