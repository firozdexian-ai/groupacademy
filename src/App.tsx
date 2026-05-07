import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BootGate } from "@/components/BootGate";
import { TalentProvider } from "@/contexts/TalentContext";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { useTalent } from "@/hooks/useTalent";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

// Components
import { ProtectedRoute } from "./components/ProtectedRoute";
import { TalentAppShell } from "./layouts/TalentAppShell";

// Public Pages
import Index from "./pages/Index";
import AuthChat from "./pages/AuthChat";
import AuthClassic from "./pages/AuthClassic";
import AuthCallback from "./pages/AuthCallback";
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
// Legacy B2B pages removed — all B2B traffic now flows through /gro10x
import PublicCourses from "./pages/PublicCourses";
import ServiceLanding from "./pages/ServiceLanding";
import VerifyCertificate from "./pages/VerifyCertificate";
import VerifySkillCredential from "./pages/VerifySkillCredential";
import PublicTalentProfile from "./pages/public/PublicTalentProfile";
import WebinarLanding from "./pages/public/WebinarLanding";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { PWAUpdatePrompt } from "./components/PWAUpdatePrompt";

// Admin Pages
import Dashboard from "./pages/Dashboard";
import DashboardChat from "./pages/DashboardChat";
import AdminMessagingInbox from "./pages/AdminMessagingInbox";
// CompanyPortal retired — /company now redirects to /gro10x
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
import PostDetail from "./pages/app/PostDetail";
import CreatorAnalytics from "./pages/app/CreatorAnalytics";
import LearningHub from "./pages/app/LearningHub";
import LearningReview from "./pages/LearningReview";
import ServicesHub from "./pages/app/ServicesHub";
import JobsHub from "./pages/app/JobsHub";
import CareerAbroad from "./pages/app/CareerAbroad";
import AIAgents from "./pages/app/AIAgents";
import MyAgents from "./pages/app/MyAgents";
import AgentMarketplace from "./pages/app/AgentMarketplace";
import AgentChat from "./pages/app/AgentChat";
import AIGeneral from "./pages/app/AIGeneral";
import CareerCoach from "./pages/app/CareerCoach";
import Profile from "./pages/app/Profile";
import ProfileEdit from "./pages/app/ProfileEdit";
import Notifications from "./pages/app/Notifications";
import Messages from "./pages/app/Messages";
import MessageThread from "./pages/app/MessageThread";
import AgentProfile from "./pages/app/AgentProfile";
import MyResults from "./pages/app/MyResults";
import MyApplications from "./pages/app/MyApplications";
import AppApplicationDetail from "./pages/app/AppApplicationDetail";
import AppInterviewSchedule from "./pages/app/AppInterviewSchedule";
import AppOfferDecision from "./pages/app/AppOfferDecision";
import SavedItems from "./pages/app/SavedItems";
import Gigs from "./pages/app/Gigs";
import NewGigWizard from "./pages/app/NewGigWizard";
import GigAppeals from "./pages/app/GigAppeals";
import GigDisputes from "./pages/app/GigDisputes";
import ReviewerCockpit from "./pages/app/ReviewerCockpit";
import MyProjects from "./pages/app/MyProjects";
import ProjectRoom from "./pages/app/ProjectRoom";
import MarketplaceGigDetail from "./pages/app/MarketplaceGigDetail";
import Transactions from "./pages/app/Transactions";
import Withdrawals from "./pages/app/Withdrawals";
import TalentDirectory from "./pages/app/TalentDirectory";
import TalentPublicProfile from "./pages/app/TalentPublicProfile";
import Connections from "./pages/app/Connections";
import ProfileVerify from "./pages/app/ProfileVerify";

import CVMaker from "./pages/app/tools/CVMaker";
import ApplicationHelper from "./pages/app/tools/ApplicationHelper";

// Feature Details
import AppJobs from "./pages/app/AppJobs";
import AppJobDetail from "./pages/app/AppJobDetail";
import CourseProjectDetail from "./pages/app/CourseProjectDetail";
import AppJobApplication from "./pages/app/AppJobApplication";
import AppCourses from "./pages/app/AppCourses";
import AppCourseDetail from "./pages/app/AppCourseDetail";
import AppMyLearning from "./pages/app/AppMyLearning";
import TalentMirror from "./pages/app/TalentMirror";
import InstructorReviewQueue from "./pages/app/InstructorReviewQueue";
import InstructorInsights from "./pages/app/InstructorInsights";
import InstructorShell from "./pages/app/instructor/InstructorShell";
import InstructorCourseSessions from "./pages/app/instructor/InstructorCourseSessions";
import AppCohortHome from "./pages/app/AppCohortHome";
import AppSessionJoin from "./pages/app/AppSessionJoin";
import AppCohortDiscussions from "./pages/app/AppCohortDiscussions";
import AppDiscussionThread from "./pages/app/AppDiscussionThread";
import AppReviewQueue from "./pages/app/AppReviewQueue";
import AppSubmissionDetail from "./pages/app/AppSubmissionDetail";
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
import StudyAbroadRoadmapResults from "./pages/app/StudyAbroadRoadmapResults";
import IELTSPrep from "./pages/app/IELTSPrep";
import AbroadHub from "./pages/app/AbroadHub";
import DestinationAgentPage from "./pages/app/DestinationAgentPage";
import AbroadApplications from "./pages/app/AbroadApplications";
import AbroadCounsellor from "./pages/app/AbroadCounsellor";
import IELTSCoach from "./pages/app/IELTSCoach";
import IELTSMockRunner from "./pages/app/IELTSMockRunner";
import IELTSResults from "./pages/app/IELTSResults";
import LanguagesHub from "./pages/app/LanguagesHub";
import LanguagePracticePage from "./pages/app/LanguagePracticePage";
import LanguageInstructorsPage from "./pages/app/LanguageInstructorsPage";
import Competitions from "./pages/app/Competitions";
import CompetitionDetail from "./pages/app/CompetitionDetail";
import Blog from "./pages/app/Blog";
import BlogPost from "./pages/app/BlogPost";
import PublicBlog from "./pages/PublicBlog";
import PublicBlogPost from "./pages/PublicBlogPost";
import Unsubscribe from "./pages/app/Unsubscribe";
import { Gro10xRoutes } from "./gro10x/Gro10xRoutes";
import { IS_GRO10X } from "./lib/host";
import PublicCompanyPage from "./pages/public/PublicCompanyPage";
import CompanyBrandedCatalog from "./pages/public/CompanyBrandedCatalog";
import PublicProjectsIndex from "./pages/public/PublicProjectsIndex";
import PublicProjectDetail from "./pages/public/PublicProjectDetail";
import PublicLeaderboard from "./pages/public/PublicLeaderboard";
import CompanyPublicProjects from "./pages/public/CompanyPublicProjects";

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
  const { talent, isTalentLoading, refreshTalent } = useTalent();
  const [showWizard, setShowWizard] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (isTalentLoading) return;
    if (talent && !talent.onboardingCompletedAt) {
      setShowWizard(true);
    } else if (talent?.onboardingCompletedAt) {
      setShowWizard(false);
    }
  }, [talent, isTalentLoading, location.pathname]);

  const handleComplete = async () => {
    await refreshTalent();
    setShowWizard(false);
  };

  // Avoid flicker until talent context hydrates
  if (isTalentLoading && !talent) return <>{children}</>;

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
            <ImpersonationProvider>
            <TalentProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <PWAInstallPrompt />
                <PWAUpdatePrompt />

                <Routes>
                  {/* ================= PUBLIC ROUTES ================= */}
                  <Route path="/" element={IS_GRO10X ? <Navigate to="/gro10x" replace /> : <Index />} />
                  <Route path="/auth" element={<AuthChat />} />
                  <Route path="/auth/classic" element={<AuthClassic />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Public Job View */}
                  <Route path="/jobs/:id" element={<PublicJobDetail />} />
                  <Route path="/jobs/:id/apply" element={<JobApplyRedirect />} />

                  {/* Public Content */}
                  <Route path="/courses/:slug" element={<CourseDetail />} />
                  <Route path="/courses" element={<PublicCourses />} />
                  <Route path="/webinar/:slug" element={<WebinarLanding />} />
                  <Route path="/services" element={<PublicServices />} />
                  <Route path="/career-services" element={<PublicServices />} />
                  {/* Legacy B2B routes — redirect to the unified Gro10x funnel */}
                  <Route path="/for-companies" element={<Navigate to="/gro10x" replace />} />
                  <Route path="/for-companies/signup" element={<Navigate to="/gro10x/auth" replace />} />
                  <Route path="/for-companies/apply" element={<Navigate to="/gro10x/auth" replace />} />

                  {/* ================= GRO10X (B2B super-app) ================= */}
                  <Route path="/gro10x/*" element={<Gro10xRoutes />} />
                  <Route path="/c/:slug" element={<PublicCompanyPage />} />
                  <Route path="/c/:slug/learn" element={<CompanyBrandedCatalog />} />
                  <Route path="/service/:serviceSlug" element={<ServiceLanding />} />
                  <Route path="/blog" element={<PublicBlog />} />
                  <Route path="/blog/:slug" element={<PublicBlogPost />} />
                  <Route path="/verify/:code" element={<VerifyCertificate />} />
                  <Route path="/verify/skill/:code" element={<VerifySkillCredential />} />
                  <Route path="/t/:handle" element={<PublicTalentProfile />} />

                  {/* Phase 5.6 — public discovery */}
                  <Route path="/projects" element={<PublicProjectsIndex />} />
                  <Route path="/projects/:slug" element={<PublicProjectDetail />} />
                  <Route path="/leaderboards" element={<Navigate to="/leaderboards/talents" replace />} />
                  <Route path="/leaderboards/:kind" element={<PublicLeaderboard />} />
                  <Route path="/c/:slug/projects" element={<CompanyPublicProjects />} />

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
                  <Route
                    path="/dashboard/chat"
                    element={
                      <ProtectedRoute requireAnyAdminRole>
                        <DashboardChat />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/messaging"
                    element={
                      <ProtectedRoute requireAnyAdminRole>
                        <AdminMessagingInbox />
                      </ProtectedRoute>
                    }
                  />
                  {/* Legacy company portal — redirect to Gro10x */}
                  <Route path="/company" element={<Navigate to="/gro10x" replace />} />
                  <Route path="/company/*" element={<Navigate to="/gro10x" replace />} />
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
                    <Route path="feed/post/:id" element={<PostDetail />} />
                    <Route path="creator/analytics" element={<CreatorAnalytics />} />
                    <Route path="jobs" element={<JobsHub />} />
                    <Route path="learning" element={<LearningHub />} />
                    <Route path="learning/review" element={<LearningReview />} />
                    <Route path="services" element={<Navigate to="/app/jobs?tab=tools" replace />} />
                    <Route path="abroad" element={<AbroadHub />} />
                    <Route path="abroad/destinations/:country" element={<DestinationAgentPage />} />
                    <Route path="abroad/applications" element={<AbroadApplications />} />
                    <Route path="counsellor" element={<AbroadCounsellor />} />
                    <Route path="abroad/ielts" element={<IELTSCoach />} />
                    <Route path="abroad/ielts/mock/:section" element={<IELTSMockRunner />} />
                    <Route path="abroad/ielts/results/:id" element={<IELTSResults />} />
                    <Route path="languages" element={<LanguagesHub />} />
                    <Route path="languages/:code/practice" element={<LanguagePracticePage />} />
                    <Route path="languages/:code/instructors" element={<LanguageInstructorsPage />} />
                    <Route path="agents" element={<AIAgents />} />
                    <Route path="my-agents" element={<MyAgents />} />
                    <Route path="agent-marketplace" element={<AgentMarketplace />} />
                    <Route path="gigs" element={<Gigs />} />
                    <Route path="gigs/new" element={<NewGigWizard />} />
                    <Route path="gigs/appeals" element={<GigAppeals />} />
                    <Route path="gigs/disputes" element={<GigDisputes />} />
                    <Route path="reviewer" element={<ReviewerCockpit />} />
                    <Route path="projects" element={<MyProjects />} />
                    <Route path="projects/:projectId" element={<ProjectRoom />} />
                    <Route path="marketplace" element={<Navigate to="/app/gigs?tab=projects" replace />} />
                    <Route path="marketplace/:id" element={<MarketplaceGigDetail />} />
                    <Route path="my-gigs" element={<Navigate to="/app/gigs?tab=activity" replace />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="talents" element={<TalentDirectory />} />
                    <Route path="talents/:id" element={<TalentPublicProfile />} />
                    <Route path="connections" element={<Connections />} />

                    {/* Job Routes - Specific Routes First */}
                    <Route path="jobs/all" element={<AppJobs />} />
                    <Route path="jobs/:id" element={<AppJobDetail />} />
                    <Route path="jobs/:id/apply" element={<AppJobApplication />} />
                    <Route path="job-assessment/:assessmentId" element={<JobAssessment />} />
                    <Route path="job-assessment/:assessmentId/results" element={<JobAssessmentResults />} />
                    <Route path="applications" element={<MyApplications />} />
                    <Route path="applications/:id" element={<AppApplicationDetail />} />
                    <Route path="applications/:id/interview/:interviewId" element={<AppInterviewSchedule />} />
                    <Route path="applications/:id/offer/:offerId" element={<AppOfferDecision />} />
                    <Route path="saved" element={<SavedItems />} />
                    <Route path="course-project/:projectId" element={<CourseProjectDetail />} />

                    {/* Learning Routes */}
                    <Route path="learning/tracks" element={<AppProfessions />} />
                    <Route path="learning/tracks/school/:slug" element={<SchoolDetail />} />
                    <Route path="learning/tracks/:slug" element={<AppProfessionDetail />} />
                    <Route path="learning/courses" element={<AppCourses />} />
                    <Route path="learning/courses/:slug" element={<AppCourseDetail />} />
                    <Route path="learning/my-courses" element={<AppMyLearning />} />
                    <Route path="talent-mirror" element={<TalentMirror />} />
                    <Route path="instructor" element={<InstructorShell />} />
                    <Route path="instructor/review-queue" element={<InstructorReviewQueue />} />
                    <Route path="instructor/insights" element={<InstructorInsights />} />
                    <Route path="instructor/course/:contentId/sessions" element={<InstructorCourseSessions />} />
                    <Route path="cohorts/:cohortId" element={<AppCohortHome />} />
                    <Route path="cohorts/:cohortId/discussions" element={<AppCohortDiscussions />} />
                    <Route path="cohorts/:cohortId/discussions/:threadId" element={<AppDiscussionThread />} />
                    <Route path="sessions/:sessionId/join" element={<AppSessionJoin />} />
                    <Route path="review-queue" element={<AppReviewQueue />} />
                    <Route path="submissions/:submissionId" element={<AppSubmissionDetail />} />
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
                    <Route path="career-coach" element={<CareerCoach />} />
                    <Route path="transactions" element={<Transactions />} />
                    <Route path="withdrawals" element={<Withdrawals />} />
                    <Route path="profile/verify" element={<ProfileVerify />} />
                    
                    <Route path="tools/cv-maker" element={<CVMaker />} />
                    <Route path="tools/application-helper" element={<ApplicationHelper />} />

                    {/* Study Abroad - Specific Routes First */}
                    <Route path="abroad/study" element={<StudyAbroad />} />
                    <Route path="abroad/study/:id" element={<StudyAbroadDetail />} />
                    <Route path="abroad/ielts-legacy" element={<IELTSPrep />} />
                    <Route path="abroad/roadmap" element={<Navigate to="/app/abroad" replace />} />
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
            </ImpersonationProvider>
          </BootGate>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
