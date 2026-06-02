import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchAdminDashboard, 
  fetchAdminKpis, 
  fetchAdminAdvancedAnalytics, 
  fetchAdminOverviewKpis, 
  fetchAdminActiveTrends, 
  fetchAdminAtRiskStudents, 
  fetchAdminMcqHeatmap, 
  fetchAdminMostFailedMcqs, 
  fetchAdminRevenue,
  fetchAdminMcqStats,
  fetchAdminStudentReports,
  fetchAdminStudentDetailReport,
  fetchAdminPayments,
  fetchAdminUsers,
  verifyPayment,
  verifyUser,
  updateUser,
  deleteUser,
  blockUser,
  unblockUser,
  revokeAccess,
  fetchAdminYears,
  fetchAdminYearModules,
  fetchAdminModuleSubjects,
  fetchAdminSubjectTopics,
  fetchAdminModuleOspes,
  fetchAdminTopicMcqs,
  deleteAdminYear,
  deleteAdminModule,
  deleteAdminSubject,
  deleteAdminTopic,
  deleteAdminMcq,
  deleteAdminOspe,
  saveAdminYear,
  saveAdminModule,
  saveAdminSubject,
  saveAdminTopic
} from '../api/admin';

/**
 * Hook to fetch admin dashboard data.
 */
export const useAdminDashboard = (isSuperAdmin) => {
  return useQuery({
    queryKey: ['admin-dashboard', isSuperAdmin],
    queryFn: fetchAdminDashboard,
    enabled: !!isSuperAdmin,
  });
};

/**
 * Combined hook for core admin analytics overview data.
 */
export const useAdminAnalyticsOverview = (dateParams, activeDays, enabled = true) => {
  const results = useQueries({
    queries: [
      {
        queryKey: ['admin-analytics-kpi', dateParams],
        queryFn: () => fetchAdminKpis(dateParams),
        enabled,
      },
      {
        queryKey: ['admin-analytics-advanced', dateParams],
        queryFn: () => fetchAdminAdvancedAnalytics(dateParams),
        enabled,
      },
      {
        queryKey: ['admin-analytics-overview-kpis'],
        queryFn: fetchAdminOverviewKpis,
        enabled,
      },
      {
        queryKey: ['admin-analytics-active-trend', activeDays],
        queryFn: () => fetchAdminActiveTrends({ days: activeDays }),
        enabled,
      },
      {
        queryKey: ['admin-analytics-at-risk'],
        queryFn: () => fetchAdminAtRiskStudents({ days: 7 }),
        enabled,
      },
      {
        queryKey: ['admin-analytics-mcq-heatmap', dateParams],
        queryFn: () => fetchAdminMcqHeatmap(dateParams),
        enabled,
      },
      {
        queryKey: ['admin-analytics-most-failed'],
        queryFn: fetchAdminMostFailedMcqs,
        enabled,
      },
      {
        queryKey: ['admin-analytics-revenue'],
        queryFn: fetchAdminRevenue,
        enabled,
      },
    ],
  });

  return {
    kpis: results[0].data,
    advanced: results[1].data,
    overviewKpis: results[2].data,
    activeTrend: results[3].data,
    atRisk: results[4].data,
    heatmap: results[5].data,
    mostFailed: results[6].data,
    revenue: results[7].data,
    isLoading: results.some(r => r.isLoading),
    isError: results.some(r => r.isError),
  };
};

export const useAdminMcqStats = (params, enabled = true) => {
  return useQuery({
    queryKey: ['admin-mcq-stats', params],
    queryFn: () => fetchAdminMcqStats(params),
    enabled,
  });
};

export const useAdminStudentReports = (params, enabled = true) => {
  return useQuery({
    queryKey: ['admin-student-reports', params],
    queryFn: () => fetchAdminStudentReports(params),
    enabled,
  });
};

export const useAdminStudentDetailReport = (studentId, params, enabled = true) => {
  return useQuery({
    queryKey: ['admin-student-detail', studentId, params],
    queryFn: () => fetchAdminStudentDetailReport(studentId, params),
    enabled: !!studentId && enabled,
  });
};

export const useAdminPayments = (params, enabled = true) => {
  return useQuery({
    queryKey: ['admin-payments', params],
    queryFn: () => fetchAdminPayments(params),
    enabled,
  });
};

export const useVerifyPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, rejectionReason }) => 
      verifyPayment(id, status, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
};

export const useAdminUsers = (params, enabled = true) => {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => fetchAdminUsers(params),
    enabled,
  });
};

export const useVerifyUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => verifyUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
};

export const useBlockUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => blockUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
};

export const useUnblockUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => unblockUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
};

export const useRevokeAccess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => revokeAccess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });
};

// --- Resources ---

export const useAdminYears = () => {
  return useQuery({
    queryKey: ['admin-years'],
    queryFn: fetchAdminYears,
  });
};

export const useAdminYearModules = (yearId, enabled = true) => {
  return useQuery({
    queryKey: ['admin-year-modules', yearId],
    queryFn: () => fetchAdminYearModules(yearId),
    enabled: !!yearId && enabled,
  });
};

export const useAdminModuleSubjects = (moduleId, enabled = true) => {
  return useQuery({
    queryKey: ['admin-module-subjects', moduleId],
    queryFn: () => fetchAdminModuleSubjects(moduleId),
    enabled: !!moduleId && enabled,
  });
};

export const useAdminSubjectTopics = (subjectId, enabled = true) => {
  return useQuery({
    queryKey: ['admin-subject-topics', subjectId],
    queryFn: () => fetchAdminSubjectTopics(subjectId),
    enabled: !!subjectId && enabled,
  });
};

export const useAdminModuleOspes = (moduleId, enabled = true) => {
  return useQuery({
    queryKey: ['admin-module-ospes', moduleId],
    queryFn: () => fetchAdminModuleOspes(moduleId),
    enabled: !!moduleId && enabled,
  });
};

export const useAdminTopicMcqs = (topicId, enabled = true) => {
  return useQuery({
    queryKey: ['admin-topic-mcqs', topicId],
    queryFn: () => fetchAdminTopicMcqs(topicId),
    enabled: !!topicId && enabled,
  });
};

export const useDeleteYear = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteAdminYear(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-years'] });
    },
  });
};

export const useDeleteModule = (yearId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteAdminModule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-year-modules', yearId] });
    },
  });
};

export const useDeleteSubject = (moduleId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteAdminSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-module-subjects', moduleId] });
    },
  });
};

export const useDeleteTopic = (subjectId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteAdminTopic(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subject-topics', subjectId] });
    },
  });
};

export const useDeleteMcq = (topicId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteAdminMcq(topicId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-topic-mcqs', topicId] });
    },
  });
};

export const useDeleteOspe = (moduleId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteAdminOspe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-module-ospes', moduleId] });
    },
  });
};

export const useSaveYear = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (year) => saveAdminYear(year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-years'] });
    },
  });
};

export const useSaveModule = (yearId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (module) => saveAdminModule(yearId, module),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-year-modules', yearId] });
    },
  });
};

export const useSaveSubject = (moduleId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subject) => saveAdminSubject(moduleId, subject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-module-subjects', moduleId] });
    },
  });
};

export const useSaveTopic = (subjectId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (topic) => saveAdminTopic(subjectId, topic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subject-topics', subjectId] });
    },
  });
};
