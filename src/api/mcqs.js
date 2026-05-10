import api from './client';

export const fetchTopicMcqs = async (topicId, { setName, type } = {}) => {
  const params = new URLSearchParams();
  if (setName) params.set('setName', setName);
  if (type) params.set('type', type);
  const qs = params.toString();
  const url = `/mcqs/topics/${topicId}${qs ? `?${qs}` : ''}`;
  const { data } = await api.get(url);
  return data;
};

export const submitMcqSession = async (topicId, sessionData) => {
  const { data } = await api.post(`/mcqs/topics/${topicId}/session`, sessionData);
  return data;
};

export const submitMcqAttempt = async ({ mcqId, selectedIndex }) => {
  const { data } = await api.post('/mcqs/attempts', { mcqId, selectedIndex });
  return data;
};
