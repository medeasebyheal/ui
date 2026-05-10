import api from './client';

export const trackVisit = async (payload) => {
  const { data } = await api.post('/analytics/track-visit', payload);
  return data;
};

export const fetchAnalytics = async (params = {}) => {
  const { data } = await api.get('/analytics', { params });
  return data;
};
