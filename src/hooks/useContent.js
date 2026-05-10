import { useQuery, useQueries, useInfiniteQuery } from '@tanstack/react-query';
import { fetchYears, fetchYearsWithModules, fetchModulesByYear, fetchModule, fetchModuleSubjects, fetchModuleOspes, fetchProff, fetchSubject, fetchSubjectTopics, fetchSubjectOneShotLectures, fetchTopic, fetchTopicResources } from '../api/content';

/**
 * Fetch all years.
 */
export const useYears = () => {
  return useQuery({
    queryKey: ['years'],
    queryFn: fetchYears,
  });
};

/**
 * Fetch years with their modules pre-loaded (single API call).
 */
export const useYearsWithModules = () => {
  return useQuery({
    queryKey: ['years-with-modules'],
    queryFn: fetchYearsWithModules,
  });
};

/**
 * For each year ID provided, fetch modules in parallel.
 * Returns { modulesByYear, isLoading, error }.
 */
export const useModulesByYears = (years = []) => {
  const results = useQueries({
    queries: years.map((y) => ({
      queryKey: ['modules-by-year', y._id],
      queryFn: () => fetchModulesByYear(y._id),
      enabled: !!y._id,
    })),
  });

  const modulesByYear = {};
  years.forEach((y, i) => {
    if (results[i]?.data) {
      modulesByYear[y._id] = (results[i].data || []).map((m) => ({ ...m, yearId: y._id, yearName: y.name }));
    }
  });

  return {
    modulesByYear,
    isLoading: results.some((r) => r.isLoading),
    error: results.find((r) => r.error)?.error || null,
  };
};

/**
 * Fetch a single module by ID.
 */
export const useModule = (moduleId) => {
  return useQuery({
    queryKey: ['module', moduleId],
    queryFn: () => fetchModule(moduleId),
    enabled: !!moduleId,
  });
};

/**
 * Fetch subjects for a module.
 */
export const useModuleSubjects = (moduleId) => {
  return useQuery({
    queryKey: ['module-subjects', moduleId],
    queryFn: () => fetchModuleSubjects(moduleId),
    enabled: !!moduleId,
  });
};

/**
 * Fetch OSPEs for a module.
 */
export const useModuleOspes = (moduleId) => {
  return useQuery({
    queryKey: ['module-ospes', moduleId],
    queryFn: () => fetchModuleOspes(moduleId),
    enabled: !!moduleId,
  });
};

/**
 * Fetch module, subjects, and OSPEs in parallel for a module detail page.
 */
export const useModuleDetail = (moduleId) => {
  const results = useQueries({
    queries: [
      {
        queryKey: ['module', moduleId],
        queryFn: () => fetchModule(moduleId),
        enabled: !!moduleId,
      },
      {
        queryKey: ['module-subjects', moduleId],
        queryFn: () => fetchModuleSubjects(moduleId),
        enabled: !!moduleId,
      },
      {
        queryKey: ['module-ospes', moduleId],
        queryFn: () => fetchModuleOspes(moduleId).catch(() => []),
        enabled: !!moduleId,
      },
    ],
  });

  return {
    module: results[0].data,
    subjects: results[1].data,
    ospes: results[2].data ?? [],
    isLoading: results.some((r) => r.isLoading),
    error: results.find((r) => r.error)?.error || null,
  };
};

/**
 * Fetch proff structure data.
 */
export const useProff = () => {
  return useQuery({
    queryKey: ['proff'],
    queryFn: fetchProff,
  });
};

/**
 * Fetch subject, topics, and lectures in parallel.
 */
export const useSubjectDetail = (moduleId, subjectId) => {
  const results = useQueries({
    queries: [
      {
        queryKey: ['subject', subjectId],
        queryFn: () => fetchSubject(subjectId),
        enabled: !!subjectId,
      },
      {
        queryKey: ['subject-topics', subjectId, 1], // Initial topics
        queryFn: () => fetchSubjectTopics(subjectId, 1),
        enabled: !!subjectId,
      },
      {
        queryKey: ['subject-lectures', subjectId],
        queryFn: () => fetchSubjectOneShotLectures(subjectId),
        enabled: !!subjectId,
      },
      {
        queryKey: ['module-subjects', moduleId],
        queryFn: () => fetchModuleSubjects(moduleId),
        enabled: !!moduleId,
      },
      {
        queryKey: ['module', moduleId],
        queryFn: () => fetchModule(moduleId),
        enabled: !!moduleId,
      },
    ],
  });

  return {
    subject: results[0].data,
    topicsData: results[1].data,
    lectures: results[2].data ?? [],
    moduleSubjects: results[3].data ?? [],
    module: results[4].data,
    isLoading: results.some((r) => r.isLoading),
    error: results.find((r) => r.error)?.error || null,
  };
};

/**
 * Infinite query for topics (for Load More).
 */
export const useInfiniteTopics = (subjectId) => {
  return useInfiniteQuery({
    queryKey: ['subject-topics-infinite', subjectId],
    queryFn: ({ pageParam = 1 }) => fetchSubjectTopics(subjectId, pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) return lastPage.page + 1;
      return undefined;
    },
    enabled: !!subjectId,
  });
};
export const fetchOspeDetail = async (ospeId) => {
  const { data } = await api.get(`/ospes/${ospeId}`);
  return data;
};

export const useOspeDetail = (ospeId) => {
  return useQuery({
    queryKey: ['ospe-detail', ospeId],
    queryFn: () => fetchOspeDetail(ospeId),
    enabled: !!ospeId,
  });
};
/**
 * Fetch topic detail including MCQs.
 */
export const useTopicDetail = (topicId, useFreeTrial = false) => {
  return useQuery({
    queryKey: ['topic', topicId, useFreeTrial],
    queryFn: () => fetchTopic(topicId, useFreeTrial),
    enabled: !!topicId,
  });
};

/**
 * Fetch topic resources.
 */
export const useTopicResources = (topicId) => {
  return useQuery({
    queryKey: ['topic-resources', topicId],
    queryFn: () => fetchTopicResources(topicId),
    enabled: !!topicId,
  });
};
