import api from './client';

export const fetchPackages = async () => {
  const { data } = await api.get('/packages');
  return data;
};

export const validatePromoCode = async ({ code, originalAmount }) => {
  const { data } = await api.post('/promo-codes/validate', { code, originalAmount });
  return data;
};

export const applyPackage = async ({ packageId, academicDetails }) => {
  const { data } = await api.post('/package-apply', { packageId, academicDetails });
  return data;
};

export const submitPayment = async (formData) => {
  const { data } = await api.post('/payments', formData);
  return data;
};
