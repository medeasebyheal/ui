import api from './client';

// ── Years & Modules ──────────────────────────────────────────────────────
export const fetchYears = async () => {
  const { data } = await api.get('/content/years', { skipLoader: true });
  return Array.isArray(data) ? data : Array.isArray(data?.years) ? data.years : [];
};

export const fetchYearsWithModules = async () => {
  const { data } = await api.get('/content/years-with-modules');
  return Array.isArray(data) ? data : [];
};

export const fetchModulesByYear = async (yearId) => {
  const { data } = await api.get(`/content/years/${yearId}/modules`, { skipLoader: true });
  return data;
};

// ── Modules ──────────────────────────────────────────────────────────────
export const fetchModule = async (moduleId) => {
  const { data } = await api.get(`/content/modules/${moduleId}`);
  return data;
};

export const fetchModuleSubjects = async (moduleId) => {
  const { data } = await api.get(`/content/modules/${moduleId}/subjects`);
  return data;
};

export const fetchModuleOspes = async (moduleId) => {
  const { data } = await api.get(`/ospes/modules/${moduleId}`);
  return data;
};

// ── Subjects ─────────────────────────────────────────────────────────────
export const fetchSubject = async (subjectId) => {
  const { data } = await api.get(`/content/subjects/${subjectId}`);
  return data;
};

export const fetchSubjectTopics = async (subjectId, page) => {
  const url = page ? `/content/subjects/${subjectId}/topics?page=${page}` : `/content/subjects/${subjectId}/topics`;
  const { data } = await api.get(url);
  return data;
};

export const fetchSubjectOneShotLectures = async (subjectId) => {
  const { data } = await api.get(`/content/subjects/${subjectId}/one-shot-lectures`);
  return data || [];
};

// ── Topics ───────────────────────────────────────────────────────────────
export const fetchTopic = async (topicId, useFreeTrial = false) => {
  const url = `/content/topics/${topicId}?includeMcqs=true${useFreeTrial ? '&useFreeTrial=true' : ''}`;
  const { data } = await api.get(url);
  return data;
};

export const fetchTopicResources = async (topicId) => {
  const { data } = await api.get(`/content/topics/${topicId}/resources`);
  return data;
};

// ── Proff ────────────────────────────────────────────────────────────────
export const fetchProff = async () => {
  const { data } = await api.get('/content/proff');
  return data;
};
