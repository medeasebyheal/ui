import api from './client';

export const fetchPayments = async () => {
  const { data } = await api.get('/payments');
  return data;
};
