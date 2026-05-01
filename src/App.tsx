import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BootGate } from "@/components/BootGate";
import { TalentProvider } from "@/contexts/TalentContext";
import { useTalent } from "@/hooks/useTalent";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

// Components
import { ProtectedRoute } from "./components/ProtectedRoute";
import { TalentAppShell } from "./layouts/TalentAppShell";

// Public Pages
import Index from "./pages/Index";
import AuthChat from "./pages/AuthChat";
import AuthClassic from "./pages/AuthClassic";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import PublicJobDetail from "./pages/PublicJobDetail";
import CareerAssessment from "./pages/CareerAssessment";
import AssessmentResults from "./pages/AssessmentResults";
import PortfolioRequest from "./pages/PortfolioRequest";
import PortfolioStatus from "./pages/PortfolioStatus";
import CourseDetail from "./pages/CourseDetail";
import PublicServiceLanding from "./pages/PublicServiceLanding";
import PublicServices from "./pages/PublicServices";
import ForCompanies from "./pages/public/ForCompanies";
import CompanyOnboarding from "./pages/public/CompanyOnboarding";
import PublicCourses from "./pages/PublicCourses";
import ServiceLanding from "./pages/ServiceLanding";
import VerifyCertificate from "./pages/VerifyCertificate";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { PWAUpdatePrompt } from "./components/PWAUpdatePrompt";

// Admin Pages
import Dashboard from "./pages/Dashboard";
import CompanyPortal from "./pages/company/CompanyPortal";
import Students from "./pages/Students";
import Enrollments from "./pages/Enrollments";
import Instructors from "./pages/Instructors";
import InstructorNew from "./pages/InstructorNew";
import InstructorEdit from "./pages/InstructorEdit";
import Sessions from "./pages/Sessions";
import SessionNew from "./pages/SessionNew";
import SessionEdit from "./pages/SessionEdit";
import ContentNew from "./pages/ContentNew";
import ContentEdit from "./pages/ContentEdit";
import QuizManagement from "./pages/QuizManagement";
import ModuleManagement from "./pages/ModuleManagement";
import ModuleResourcesManager from "./pages/ModuleResourcesManager";
import Organization from "./pages/Organization";

// App/Dashboard Pages
import Feed from "./pages/app/Feed";
import LearningHub from "./pages/app/LearningHub";
import ServicesHub from "./pages/app/ServicesHub";
import JobsHub from "./pages/app/JobsHub";
import CareerAbroad from "./pages/app/CareerAbroad";
import AIAgents from "./pages/app/AIAgents";
import MyAgents from "./pages/app/MyAgents";
import AgentMarketplace from "./pages/app/AgentMarketplace";
import AgentChat from "./pages/app/AgentChat";
import AIGeneral from "./pages/app/AIGeneral";
import Profile from "./pages/app/Profile";
import ProfileEdit from "./pages/app/ProfileEdit";
import Notifications from "./pages/app/Notifications";
import Messages from "./pages/app/Messages";
import MessageThread from "./pages/app/MessageThread";
import AgentProfile from "./pages/app/AgentProfile";
import MyResults from "./pages/app/MyResults";
import MyApplications from "./pages/app/MyApplications";
import SavedItems from "./pages/app/SavedItems";
import Gigs from "./pages/app/Gigs";
import MarketplaceGigDetail from "./pages/app/MarketplaceGigDetail";
import Transactions from "./pages/app/Transactions";
import Withdrawals from "./pages/app/Withdrawals";
import ProfileVerify from "./pages/app/ProfileVerify";
import ContentStudio from "./pages/app/ContentStudio";
import CVMaker from "./pages/app/tools/CVMaker";
import ApplicationHelper from "./pages/app/tools/ApplicationHelper";

// Feature Details
import AppJobs from "./pages/app/AppJobs";
import AppJobDetail from "./pages/app/AppJobDetail";
import AppJobApplication from "./pages/app/AppJobApplication";
import AppCourses from "./pages/app/AppCourses";
import AppCourseDetail from "./pages/app/AppCourseDetail";
import AppMyLearning from "./pages/app/AppMyLearning";
import AppProfessions from "./pages/app/AppProfessions";
import AppProfessionDetail from "./pages/app/AppProfessionDetail";
import SchoolDetail from "./pages/app/SchoolDetail";
import AppEvents from "./pages/app/AppEvents";
import ImmersiveCoursePlayer from "./pages/ImmersiveCoursePlayer";
import Quiz from "./pages/Quiz";
import ReportCard from "./pages/ReportCard";
import JobAssessment from "./pages/app/JobAssessment";
import JobAssessmentResults from "./pages/app/JobAssessmentResults";

// Services Internal
import AppCareerAssessment from "./pages/app/AppCareerAssessment";
import AppMockInterviewSetup from "./pages/app/AppMockInterviewSetup";
import AppSalaryAnalysisSetup from "./pages/app/AppSalaryAnalysisSetup";
import AppPortfolioRequest from "./pages/app/AppPortfolioRequest";

// Mock Interview & Salary Public/Private
import MockInterview from "./pages/MockInterview";
import MockInterviewSetup from "./pages/MockInterviewSetup";
import MockInterviewQuestions from "./pages/MockInterviewQuestions";
import MockInterviewCapture from "./pages/MockInterviewCapture";
import MockInterviewResults from "./pages/MockInterviewResults";
import SalaryAnalysis from "./pages/SalaryAnalysis";
import SalaryAnalysisSetup from "./pages/SalaryAnalysisSetup";
import SalaryAnalysisProcessing from "./pages/SalaryAnalysisProcessing";
import SalaryAnalysisResults from "./pages/SalaryAnalysisResults";

// Study Abroad & Blog
import StudyAbroad from "./pages/app/StudyAbroad";
import StudyAbroadDetail from "./pages/app/StudyAbroadDetail";
import StudyAbroadRoadmap from "./pages/app/StudyAbroadRoadmap";
import StudyAbroadRoadmapResults from "./pages/app/StudyAbroadRoadmapResults";
import IELTSPrep from "./pages/app/IELTSPrep";
import Competitions from "./pages/app/Competitions";
import CompetitionDetail from "./pages/app/CompetitionDetail";
import Blog from "./pages/app/Blog";
import BlogPost from "./pages/app/BlogPost";
import PublicBlog from "./pages/PublicBlog";
import PublicBlogPost from "./pages/PublicBlogPost";
import Unsubscribe from "./pages/app/Unsubscribe";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes("timed out")) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

// Helper component to handle dynamic redirect with ID
const JobApplyRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/auth?returnTo=/app/jobs/${id}/apply`} replace />;
};

// Inline Guard Component to Force Onboarding
const OnboardingGuard = ({ children }: { children: React.ReactNode }) => {
  const { talent, refreshTalent } = useTalent();
  const [showWizard, setShowWizard] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (talent && !talent.onboardingCompletedAt) {
      setShowWizard(true);
    }
  }, [talent, location.pathname]);

  const handleComplete = async () => {
    await refreshTalent();
    setShowWizard(false);
  };

  if (showWizard) {
    return (
      <>
        <div className="opacity-0 pointer-events-none h-0 overflow-hidden">{children}</div>
        <OnboardingWizard onComplete={handleComplete} />
      </>
    );
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {/* FIX: Added React Router v7 future flags */}
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <BootGate>
            <TalentProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <PWAInstallPrompt />
                <PWAUpdatePrompt />

                <Routes>
                  {/* ================= PUBLIC ROUTES ================= */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<AuthChat />} />
                  <Route path="/auth/classic" element={<AuthClassic />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Public Job View */}
                  <Route path="/jobs/:id" element={<PublicJobDetail />} />
                  <Route path="/jobs/:id/apply" element={<JobApplyRedirect />} />

                  {/* Public Content */}
                  <Route path="/courses/:slug" element={<CourseDetail />} />
                  <Route path="/courses" element={<PublicCourses />} />
                  <Route path="/services" element={<PublicServices />} />
                  <Route path="/career-services" element={<PublicServices />} />
                  <Route path="/for-companies" element={<ForCompanies />} />
                  <Route path="/for-companies/apply" element={<CompanyOnboarding />} />
                  <Route path="/service/:serviceSlug" element={<ServiceLanding />} />
                  <Route path="/blog" element={<PublicBlog />} />
                  <Route path="/blog/:slug" element={<PublicBlogPost />} />
                  <Route path="/verify/:code" element={<VerifyCertificate />} />

                  {/* Public Services */}
                  <Route path="/career-assessment" element={<CareerAssessment />} />
                  <Route path="/assessment-results/:id" element={<AssessmentResults />} />
                  <Route path="/portfolio-request" element={<PortfolioRequest />} />
                  <Route path="/portfolio-status" element={<PortfolioStatus />} />

                  {/* Mock Interview Public Flow */}
                  <Route path="/mock-interview" element={<MockInterview />} />
                  <Route path="/mock-interview/setup" element={<MockInterviewSetup />} />
                  <Route path="/mock-interview/questions/:id" element={<MockInterviewQuestions />} />
                  <Route path="/mock-interview/capture/:id" element={<MockInterviewCapture />} />
                  <Route path="/mock-interview/results/:id" element={<MockInterviewResults />} />

                  {/* Salary Analysis Public Flow */}
                  <Route path="/salary-analysis" element={<SalaryAnalysis />} />
                  <Route path="/salary-analysis/setup" element={<SalaryAnalysisSetup />} />
                  <Route path="/salary-analysis/processing/:id" element={<SalaryAnalysisProcessing />} />
                  <Route path="/salary-analysis/results/:id" element={<SalaryAnalysisResults />} />

                  {/* Unsubscribe (public — no auth required) */}
                  <Route path="/unsubscribe" element={<Unsubscribe />} />

                  {/* Redirects */}
                  <Route path="/jobs" element={<Navigate to="/auth?returnTo=/app/jobs" replace />} />
                  <Route path="/professions" element={<Navigate to="/auth?returnTo=/app/learning/tracks" replace />} />
                  <Route path="/my-profile" element={<Navigate to="/app/profile" replace />} />
                  <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/my-learning" element={<Navigate to="/app/learning/my-courses" replace />} />

                  {/* ================= ADMIN ROUTES ================= */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute requireAnyAdminRole>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  {/* ================= COMPANY PORTAL ================ */}
                  <Route path="/company" element={<CompanyPortal />} />
                  <Route path="/company/*" element={<CompanyPortal />} />
                  <Route
                    path="/students"
                    element={
                      <ProtectedRoute requireAdmin>
                        <Students />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/enrollments"
                    element={
                      <ProtectedRoute requireAdmin>
                        <Enrollments />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/instructors"
                    element={
                      <ProtectedRoute>
                        <Instructors />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/instructors/new"
                    element={
                      <ProtectedRoute requireAdmin>
                        <InstructorNew />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/instructors/:id/edit"
                    element={
                      <ProtectedRoute requireAdmin>
                        <InstructorEdit />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/sessions"
                    element={
                      <ProtectedRoute requireAdmin>
                        <Sessions />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/sessions/new"
                    element={
                      <ProtectedRoute requireAdmin>
                        <SessionNew />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/sessions/:id/edit"
                    element={
                      <ProtectedRoute requireAdmin>
                        <SessionEdit />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/content/new"
                    element={
                      <ProtectedRoute requireAdmin>
                        <ContentNew />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/content/:id/edit"
                    element={
                      <ProtectedRoute requireAdmin>
                        <ContentEdit />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/quiz-manage/:contentId"
                    element={
                      <ProtectedRoute requireAdmin>
                        <QuizManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/content/:contentId/modules"
                    element={
                      <ProtectedRoute requireAdmin>
                        <ModuleManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/content/:contentId/modules/:moduleId/resources"
                    element={
                      <ProtectedRoute requireAdmin>
                        <ModuleResourcesManager />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/org" element={<Organization />} />

                  {/* ================= MAIN APP ROUTES (Protected) ================= */}
                  <Route path="/app" element={<Navigate to="/app/feed" replace />} />

                  {/* The TalentAppShell Layout Wraps All These Routes */}
                  <Route
                    path="/app/*"
                    element={
                      <ProtectedRoute>
                        <OnboardingGuard>
                          <TalentAppShell />
                        </OnboardingGuard>
                      </ProtectedRoute>
                    }
                  >
                    {/* Main Hubs */}
                    <Route path="feed" element={<Feed />} />
                    <Route path="jobs" element={<JobsHub />} />
                    <Route path="learning" element={<LearningHub />} />
                    <Route path="services" element={<Navigate to="/app/agents" replace />} />
                    <Route path="abroad" element={<CareerAbroad />} />
                    <Route path="agents" element={<AIAgents />} />
                    <Route path="my-agents" element={<MyAgents />} />
                    <Route path="agent-marketplace" element={<AgentMarketplace />} />
                    <Route path="gigs" element={<Gigs />} />
                    <Route path="marketplace" element={<Navigate to="/app/gigs?tab=projects" replace />} />
                    <Route path="marketplace/:id" element={<MarketplaceGigDetail />} />
                    <Route path="my-gigs" element={<Navigate to="/app/gigs?tab=activity" replace />} />
                    <Route path="profile" element={<Profile />} />

                    {/* Job Routes - Specific Routes First */}
                    <Route path="jobs/all" element={<AppJobs />} />
                    <Route path="jobs/:id" element={<AppJobDetail />} />
                    <Route path="jobs/:id/apply" element={<AppJobApplication />} />
                    <Route path="job-assessment/:assessmentId" element={<JobAssessment />} />
                    <Route path="job-assessment/:assessmentId/results" element={<JobAssessmentResults />} />
                    <Route path="applications" element={<MyApplications />} />
                    <Route path="saved" element={<SavedItems />} />

                    {/* Learning Routes */}
                    <Route path="learning/tracks" element={<AppProfessions />} />
                    <Route path="learning/tracks/school/:slug" element={<SchoolDetail />} />
                    <Route path="learning/tracks/:slug" element={<AppProfessionDetail />} />
                    <Route path="learning/courses" element={<AppCourses />} />
                    <Route path="learning/courses/:slug" element={<AppCourseDetail />} />
                    <Route path="learning/my-courses" element={<AppMyLearning />} />
                    <Route path="learning/events" element={<AppEvents />} />
                    <Route path="learning/webinars" element={<AppEvents />} />
                    <Route path="learning/competitions" element={<Competitions />} />
                    <Route path="learning/competitions/:slug" element={<CompetitionDetail />} />
                    <Route path="learning/blog" element={<Blog />} />
                    <Route path="learning/blog/:slug" element={<BlogPost />} />

                    {/* Internal Blog Routes */}
                    <Route path="blog" element={<Blog />} />
                    <Route path="blog/:slug" element={<BlogPost />} />

                    {/* Services Routes */}
                    <Route path="services/assessment" element={<AppCareerAssessment />} />
                    <Route path="services/mock-interview" element={<AppMockInterviewSetup />} />
                    <Route path="services/salary-analysis" element={<AppSalaryAnalysisSetup />} />
                    <Route path="services/portfolio" element={<AppPortfolioRequest />} />
                    <Route path="services/my-results" element={<MyResults />} />

                    {/* Other App Routes */}
                    <Route path="notifications" element={<Navigate to="/app/messages" replace />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="messages/:threadKey" element={<MessageThread />} />
                    <Route path="profile/edit" element={<ProfileEdit />} />
                    <Route path="agents/:agentKey/profile" element={<AgentProfile />} />
                    <Route path="agents/:agentKey" element={<AgentChat />} />
                    <Route path="ai-general" element={<AIGeneral />} />
                    <Route path="transactions" element={<Transactions />} />
                    <Route path="withdrawals" element={<Withdrawals />} />
                    <Route path="profile/verify" element={<ProfileVerify />} />
                    <Route path="studio" element={<ContentStudio />} />
                    <Route path="tools/cv-maker" element={<CVMaker />} />
                    <Route path="tools/application-helper" element={<ApplicationHelper />} />

                    {/* Study Abroad - Specific Routes First */}
                    <Route path="abroad/study" element={<StudyAbroad />} />
                    <Route path="abroad/study/:id" element={<StudyAbroadDetail />} />
                    <Route path="abroad/ielts" element={<IELTSPrep />} />
                    <Route path="abroad/roadmap" element={<StudyAbroadRoadmap />} />
                    <Route path="abroad/roadmap/:id" element={<StudyAbroadRoadmapResults />} />

                    {/* Content Players */}
                    <Route path="learn/:slug" element={<ImmersiveCoursePlayer />} />
                    <Route path="report-card/:enrollmentId" element={<ReportCard />} />
                    <Route path="quiz/:slug" element={<Quiz />} />
                  </Route>

                  {/* 404 Handler */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TooltipProvider>
            </TalentProvider>
          </BootGate>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
