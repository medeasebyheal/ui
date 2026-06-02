import api from './client';

export const fetchAdminDashboard = async () => {
  const { data } = await api.get('/admin/dashboard');
  return data;
};

export const fetchAdminUsers = async (params = {}) => {
  const { data } = await api.get('/users', { params });
  return data;
};

export const fetchAdminPayments = async (params = {}) => {
  const { data } = await api.get('/payments', { params });
  return data;
};

export const fetchAdminAdmins = async () => {
  const { data } = await api.get('/admin/admins');
  return data;
};

export const fetchAdminPackages = async () => {
  const { data } = await api.get('/admin/packages');
  return data;
};

export const fetchAdminPromoCodes = async () => {
  const { data } = await api.get('/admin/promo-codes');
  return data;
};

export const fetchAdminPrograms = async () => {
  const { data } = await api.get('/admin/programs');
  return data;
};

export const fetchContactQueries = async (params = {}) => {
  const { data } = await api.get('/admin/contact-queries', { params });
  return data;
};

export const fetchGeminiUsage = async () => {
  const { data } = await api.get('/admin/gemini-usage');
  return data;
};

// --- Analytics ---

export const fetchAdminKpis = async (params) => {
  const { data } = await api.get('/admin/analytics/kpi', { params });
  return data;
};

export const fetchAdminAdvancedAnalytics = async (params) => {
  const { data } = await api.get('/admin/analytics/advanced', { params });
  return data;
};

export const fetchAdminOverviewKpis = async () => {
  const { data } = await api.get('/admin/analytics/overview-kpis');
  return data;
};

export const fetchAdminActiveTrends = async (params) => {
  const { data } = await api.get('/admin/analytics/active-trend', { params });
  return data;
};

export const fetchAdminAtRiskStudents = async (params) => {
  const { data } = await api.get('/admin/analytics/at-risk', { params });
  return data;
};

export const fetchAdminMcqHeatmap = async (params) => {
  const { data } = await api.get('/admin/analytics/mcq-heatmap', { params });
  return data;
};

export const fetchAdminMostFailedMcqs = async () => {
  const { data } = await api.get('/admin/analytics/most-failed');
  return data;
};

export const fetchAdminRevenue = async () => {
  const { data } = await api.get('/admin/analytics/revenue');
  return data;
};

export const fetchAdminMcqStats = async (params) => {
  const { data } = await api.get('/admin/analytics/mcq-options', { params });
  return data;
};

export const fetchAdminStudentReports = async (params) => {
  const { data } = await api.get('/admin/analytics/students', { params });
  return data;
};

export const fetchAdminStudentDetailReport = async (studentId, params) => {
  const { data } = await api.get(`/admin/analytics/students/${studentId}`, { params });
  return data;
};

export const verifyPayment = async (id, status, rejectionReason) => {
  const { data } = await api.patch(`/payments/${id}/verify`, { status, rejectionReason });
  return data;
};

export const verifyUser = async (id) => {
  const { data } = await api.patch(`/users/${id}/verify`);
  return data;
};

export const updateUser = async (id, userData) => {
  const { data } = await api.put(`/users/${id}`, userData);
  return data;
};

export const deleteUser = async (id) => {
  const { data } = await api.delete(`/users/${id}`);
  return data;
};

export const blockUser = async (id) => {
  const { data } = await api.patch(`/users/${id}/block`);
  return data;
};

export const unblockUser = async (id) => {
  const { data } = await api.patch(`/users/${id}/unblock`);
  return data;
};

export const revokeAccess = async (id) => {
  const { data } = await api.patch(`/users/${id}/revoke`);
  return data;
};

// --- Resources ---

export const fetchAdminYears = async () => {
  const { data } = await api.get('/admin/years');
  return data;
};

export const fetchAdminYearModules = async (yearId) => {
  const { data } = await api.get(`/admin/years/${yearId}/modules`);
  return data;
};

export const fetchAdminModuleSubjects = async (moduleId) => {
  const { data } = await api.get(`/admin/modules/${moduleId}/subjects`);
  return data;
};

export const fetchAdminSubjectTopics = async (subjectId) => {
  const { data } = await api.get(`/admin/subjects/${subjectId}/topics`);
  return data;
};

export const fetchAdminModuleOspes = async (moduleId) => {
  const { data } = await api.get(`/admin/modules/${moduleId}/ospes`);
  return data;
};

export const copyAdminModuleOspes = async (moduleId, sourceModuleId, ospeIds) => {
  const { data } = await api.post(`/admin/modules/${moduleId}/ospes/copy`, { sourceModuleId, ospeIds });
  return data;
};

export const fetchAdminTopicMcqs = async (topicId) => {
  const { data } = await api.get(`/admin/topics/${topicId}/mcqs`);
  return data;
};

export const deleteAdminYear = async (id) => {
  const { data } = await api.delete(`/admin/years/${id}`);
  return data;
};

export const deleteAdminModule = async (id) => {
  const { data } = await api.delete(`/admin/modules/${id}`);
  return data;
};

export const deleteAdminSubject = async (id) => {
  const { data } = await api.delete(`/admin/subjects/${id}`);
  return data;
};

export const deleteAdminTopic = async (id) => {
  const { data } = await api.delete(`/admin/topics/${id}`);
  return data;
};

export const deleteAdminMcq = async (topicId, mcqId) => {
  const { data } = await api.delete(`/admin/topics/${topicId}/mcqs/${mcqId}`);
  return data;
};

export const deleteAdminOspe = async (id) => {
  const { data } = await api.delete(`/admin/ospes/${id}`);
  return data;
};

export const saveAdminYear = async (year) => {
  if (year._id) {
    const { data } = await api.put(`/admin/years/${year._id}`, year);
    return data;
  }
  const { data } = await api.post('/admin/years', year);
  return data;
};

export const saveAdminModule = async (yearId, module) => {
  if (module._id) {
    const { data } = await api.put(`/admin/modules/${module._id}`, module);
    return data;
  }
  const { data } = await api.post(`/admin/years/${yearId}/modules`, module);
  return data;
};

export const saveAdminSubject = async (moduleId, subject) => {
  if (subject._id) {
    const { data } = await api.put(`/admin/subjects/${subject._id}`, subject);
    return data;
  }
  const { data } = await api.post(`/admin/modules/${moduleId}/subjects`, subject);
  return data;
};

export const saveAdminTopic = async (subjectId, topic) => {
  if (topic._id) {
    const { data } = await api.put(`/admin/topics/${topic._id}`, topic);
    return data;
  }
  const { data } = await api.post(`/admin/subjects/${subjectId}/topics`, topic);
  return data;
};
