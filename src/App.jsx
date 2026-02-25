import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import AuthLayout from './components/AuthLayout';
import ScrollToTop from './components/ScrollToTop';
import { StudentRoute, AdminRoute } from './components/ProtectedRoute';

import Home from './pages/Home';
import AboutPage from './pages/AboutPage';
import PackagesPage from './pages/PackagesPage';
import ModulesPage from './pages/ModulesPage';
import ProffPage from './pages/ProffPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CheckoutPage from './pages/CheckoutPage';

import StudentDashboard from './pages/student/Dashboard';
import StudentProfile from './pages/student/Profile';
import StudentResources from './pages/student/Resources';
import StudentTopic from './pages/student/Topic';
import StudentModuleOspes from './pages/student/ModuleOspes';
import ModuleDetailPage from './pages/student/ModuleDetailPage';
import SubjectDetailPage from './pages/student/SubjectDetailPage';
import TopicDetailPage from './pages/student/TopicDetailPage';
import TopicQuizPage from './pages/student/TopicQuizPage';
import StudentOspeAttempt from './pages/student/OspeAttempt';
import StudentPayments from './pages/student/Payments';

import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminPayments from './pages/admin/Payments';
import ProffLayout from './pages/admin/proff/ProffLayout';
import ProffDashboard from './pages/admin/proff/ProffDashboard';
import ProffJsmuYears from './pages/admin/proff/ProffJsmuYears';
import ProffJsmuYearDetail from './pages/admin/proff/ProffJsmuYearDetail';
import ProffOtherYears from './pages/admin/proff/ProffOtherYears';
import ProffOtherYearDetail from './pages/admin/proff/ProffOtherYearDetail';
import ProffOtherSubjectDetail from './pages/admin/proff/ProffOtherSubjectDetail';
import ProffJsmuPaperDetail from './pages/admin/proff/ProffJsmuPaperDetail';
import ProffJsmuPaperMcqForm from './pages/admin/proff/ProffJsmuPaperMcqForm';
import ProffJsmuPaperBulkMcqPage from './pages/admin/proff/ProffJsmuPaperBulkMcqPage';
import ProffOtherSubjectMcqs from './pages/admin/proff/ProffOtherSubjectMcqs';
import ProffOtherSubjectMcqForm from './pages/admin/proff/ProffOtherSubjectMcqForm';
import ProffOtherSubjectBulkMcqPage from './pages/admin/proff/ProffOtherSubjectBulkMcqPage';
import ProffOtherSubjectOspe from './pages/admin/proff/ProffOtherSubjectOspe';
import AdminPackages from './pages/admin/Packages';
import AdminPromoCodes from './pages/admin/PromoCodes';
import GeminiUsage from './pages/admin/GeminiUsage';
import AdminResources from './pages/admin/Resources';
import ResourceLayout from './pages/admin/resources/ResourceLayout';
import ProgramsList from './pages/admin/resources/ProgramsList';
import ProgramYears from './pages/admin/resources/ProgramYears';
import YearModules from './pages/admin/resources/YearModules';
import ModuleContent from './pages/admin/resources/ModuleContent';
import SubjectTopics from './pages/admin/resources/SubjectTopics';
import TopicMcqs from './pages/admin/resources/TopicMcqs';
import McqFormPage from './pages/admin/resources/McqFormPage';
import BulkMcqPage from './pages/admin/resources/BulkMcqPage';
import ModuleOspesList from './pages/admin/resources/ModuleOspesList';
import OspeFormPage from './pages/admin/resources/OspeFormPage';
import YearsList from './pages/admin/resources/YearsList';
import ModulesList from './pages/admin/resources/ModulesList';
import SubjectsList from './pages/admin/resources/SubjectsList';
import TopicsList from './pages/admin/resources/TopicsList';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="packages" element={<PackagesPage />} />
            <Route path="modules" element={<ModulesPage />} />
            <Route path="proff" element={<ProffPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>

          <Route path="student" element={<StudentRoute />}>
            <Route index element={<StudentDashboard />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="resources" element={<StudentResources />} />
            <Route path="topics/:topicId" element={<StudentTopic />} />
            <Route path="modules/:moduleId" element={<ModuleDetailPage />} />
            <Route path="modules/:moduleId/subjects/:subjectId" element={<SubjectDetailPage />} />
            <Route path="modules/:moduleId/subjects/:subjectId/topics/:topicId" element={<TopicDetailPage />} />
            <Route path="modules/:moduleId/subjects/:subjectId/topics/:topicId/quiz" element={<TopicQuizPage />} />
            <Route path="modules/:moduleId/ospes" element={<StudentModuleOspes />} />
            <Route path="ospes/:ospeId" element={<StudentOspeAttempt />} />
            <Route path="payments" element={<StudentPayments />} />
          </Route>

          <Route path="admin" element={<AdminRoute />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="resources" element={<ResourceLayout />}>
            <Route index element={<ProgramsList />} />
            <Route path="hierarchy" element={<AdminResources />} />
            <Route path="programs/:programId" element={<ProgramYears />} />
            <Route path="years" element={<YearsList />} />
            <Route path="years/:yearId" element={<YearModules />} />
            <Route path="modules" element={<ModulesList />} />
            <Route path="subjects" element={<SubjectsList />} />
            <Route path="topics" element={<TopicsList />} />
            <Route path="years/:yearId/modules/:moduleId" element={<ModuleContent />} />
            <Route path="years/:yearId/modules/:moduleId/ospes" element={<ModuleOspesList />} />
            <Route path="years/:yearId/modules/:moduleId/ospes/new" element={<OspeFormPage />} />
            <Route path="years/:yearId/modules/:moduleId/ospes/:ospeId/edit" element={<OspeFormPage />} />
            <Route path="years/:yearId/modules/:moduleId/subjects/:subjectId" element={<SubjectTopics />} />
            <Route path="years/:yearId/modules/:moduleId/subjects/:subjectId/topics/:topicId/mcqs/bulk" element={<BulkMcqPage />} />
            <Route path="years/:yearId/modules/:moduleId/subjects/:subjectId/topics/:topicId/mcqs/new" element={<McqFormPage />} />
            <Route path="years/:yearId/modules/:moduleId/subjects/:subjectId/topics/:topicId/mcqs/:mcqId/edit" element={<McqFormPage />} />
            <Route path="years/:yearId/modules/:moduleId/subjects/:subjectId/topics/:topicId" element={<TopicMcqs />} />
          </Route>
          <Route path="proff" element={<ProffLayout />}>
            <Route index element={<ProffDashboard />} />
            <Route path="jsmu" element={<ProffJsmuYears />} />
            <Route path="jsmu/years/:yearId" element={<ProffJsmuYearDetail />} />
            <Route path="jsmu/years/:yearId/papers/:paperId" element={<ProffJsmuPaperDetail />} />
            <Route path="jsmu/years/:yearId/papers/:paperId/mcqs/new" element={<ProffJsmuPaperMcqForm />} />
            <Route path="jsmu/years/:yearId/papers/:paperId/mcqs/:mcqId/edit" element={<ProffJsmuPaperMcqForm />} />
            <Route path="jsmu/years/:yearId/papers/:paperId/mcqs/bulk" element={<ProffJsmuPaperBulkMcqPage />} />
            <Route path="other" element={<ProffOtherYears />} />
            <Route path="other/years/:yearId" element={<ProffOtherYearDetail />} />
            <Route path="other/years/:yearId/subjects/:subjectId" element={<ProffOtherSubjectDetail />} />
            <Route path="other/years/:yearId/subjects/:subjectId/mcqs" element={<ProffOtherSubjectMcqs />} />
            <Route path="other/years/:yearId/subjects/:subjectId/mcqs/new" element={<ProffOtherSubjectMcqForm />} />
            <Route path="other/years/:yearId/subjects/:subjectId/mcqs/:mcqId/edit" element={<ProffOtherSubjectMcqForm />} />
            <Route path="other/years/:yearId/subjects/:subjectId/mcqs/bulk" element={<ProffOtherSubjectBulkMcqPage />} />
            <Route path="other/years/:yearId/subjects/:subjectId/ospe" element={<ProffOtherSubjectOspe />} />
          </Route>
            <Route path="packages" element={<AdminPackages />} />
            <Route path="promo-codes" element={<AdminPromoCodes />} />
            <Route path="gemini-usage" element={<GeminiUsage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
