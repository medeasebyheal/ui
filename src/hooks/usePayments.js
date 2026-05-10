import { useQuery } from '@tanstack/react-query';
import { fetchPayments } from '../api/payments';

/**
 * Hook to fetch the logged‑in user's payment history.
 * Returns { data: payments = [], isLoading, error }.
 */
export const usePayments = () => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: fetchPayments,
  });
};
