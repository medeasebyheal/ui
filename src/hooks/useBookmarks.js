import { useQuery } from '@tanstack/react-query';
import { fetchBookmarks } from '../api/bookmarks';

/**
 * Fetch bookmarks for a specific topic.
 */
export const useBookmarks = (topicId) => {
  return useQuery({
    queryKey: ['bookmarks', topicId],
    queryFn: () => fetchBookmarks(topicId),
    enabled: !!topicId,
  });
};
