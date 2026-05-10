import { useQuery } from '@tanstack/react-query';
import { fetchPing } from '../api/ping';

/**
 * Ping the backend to warm the serverless function and MongoDB connection.
 * Fires once on mount with a long staleTime so it doesn't re-fire frequently.
 */
export const usePing = () => {
  return useQuery({
    queryKey: ['ping'],
    queryFn: fetchPing,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 0,
  });
};
