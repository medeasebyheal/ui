import api from '../api/client';

export const fetchYears = async () => {
  // Returns array of years [{_id, name}]
  const { data } = await api.get('/content/years');
  return data;
};
