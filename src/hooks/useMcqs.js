import { useQuery } from '@tanstack/react-query';
import { fetchTopicMcqs } from '../api/mcqs';

/**
 * Fetch MCQs for a topic, optionally filtered by set name and type.
 */
export const useTopicMcqs = (topicId, { setName, type } = {}) => {
  return useQuery({
    queryKey: ['topic-mcqs', topicId, setName, type],
    queryFn: () => fetchTopicMcqs(topicId, { setName, type }),
    enabled: !!topicId,
  });
};
