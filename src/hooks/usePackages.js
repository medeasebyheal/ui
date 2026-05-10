import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchPackages, validatePromoCode, applyPackage, submitPayment } from '../api/packages';

/**
 * Fetch all available packages.
 */
export const usePackages = (enabled = true) => {
  return useQuery({
    queryKey: ['packages'],
    queryFn: fetchPackages,
    enabled,
  });
};

export const useValidatePromo = () => {
  return useMutation({
    mutationFn: validatePromoCode,
  });
};

export const useApplyPackage = () => {
  return useMutation({
    mutationFn: applyPackage,
  });
};

export const useSubmitPayment = () => {
  return useMutation({
    mutationFn: submitPayment,
  });
};
