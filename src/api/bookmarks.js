import api from './client';

export const fetchBookmarks = async (topicId) => {
  const { data } = await api.get('/bookmarks', { params: { topic: topicId } });
  return data;
};

export const createBookmark = async ({ topicId, mcqId }) => {
  const { data } = await api.post('/bookmarks', { topic: topicId, mcq: mcqId });
  return data;
};

export const deleteBookmark = async (bookmarkId) => {
  await api.delete(`/bookmarks/${bookmarkId}`);
};
