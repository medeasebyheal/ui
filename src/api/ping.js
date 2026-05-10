import api from './client';

export const fetchPing = async () => {
  const { data } = await api.get('/ping', { skipLoader: true });
  return data;
};
