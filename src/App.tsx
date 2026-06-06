import { lazy, Suspense } from "react";
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
import { AccountUpgradeModal } from "@/components/auth/AccountUpgradeModal";
import { PhoneCaptureModal } from "@/components/onboarding/PhoneCaptureModal";
import { PageLoadingSkeleton } from "@/components/ui/page-loading-skeleton";
import { ComingSoonGate } from "@/components/launch/ComingSoonGate";

// v0.5 launch: destination pages share one gate keyed by country slug.
function DestinationGate() {
  const { country } = useParams<{ country: string }>();
  const slug = (country ?? "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  const featureKey = `abroad-country-${slug || "unknown"}`;
  const label = country
    ? country.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "this destination";
  return (
    <ComingSoonGate
      featureKey={featureKey}
      title={`Study in ${label}`}
      description={`We're onboarding partner agents for ${label}. Join the waitlist to be the first to hear when they go live.`}
      secondaryCtaLabel="Explore Study Abroad"
      secondaryCtaHref="/app/abroad"
    />
  );
}

// Shell + guards (eager — small, used everywhere)
import { ProtectedRoute } from "./components/ProtectedRoute";
import { TalentAppShell } from "./layouts/TalentAppShell";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { PWAUpdatePrompt } from "./components/PWAUpdatePrompt";
import { IS_GRO10X } from "./lib/host";

// First-paint pages stay eager so initial render has no Suspense flash.
import Index from "./pages/Index";
import AuthChat from "./pages/AuthChat";
import AuthClassic from "./pages/AuthClassic";
import AuthCallback from "./pages/AuthCallback";
import Start from "./pages/Start";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Everything else is lazy. Grouped by area for readability only.

// Public pages
const PublicJobDetail = lazy(() => import("./pages/PublicJobDetail"));
const CareerAssessment = lazy(() => import("./pages/CareerAssessment"));
const AssessmentResults = lazy(() => import("./pages/AssessmentResults"));
const PortfolioRequest = lazy(() => import("./pages/PortfolioRequest"));
const PortfolioStatus = lazy(() => import("./pages/PortfolioStatus"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const PublicServices = lazy(() => import("./pages/PublicServices"));
const PublicCourses = lazy(() => import("./pages/PublicCourses"));
const ServiceLanding = lazy(() => import("./pages/ServiceLanding"));
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate"));
const VerifySkillCredential = lazy(() => import("./pages/VerifySkillCredential"));
const IRDocumentViewer = lazy(() => import("./pages/ir/IRDocumentViewer"));
const PublicTalentProfile = lazy(() => import("./pages/public/PublicTalentProfile"));
const WebinarLanding = lazy(() => import("./pages/public/WebinarLanding"));
const PublicCompanyPage = lazy(() => import("./pages/public/PublicCompanyPage"));
const CompanyBrandedCatalog = lazy(() => import("./pages/public/CompanyBrandedCatalog"));
const PublicProjectsIndex = lazy(() => import("./pages/public/PublicProjectsIndex"));
const PublicProjectDetail = lazy(() => import("./pages/public/PublicProjectDetail"));
const PublicLeaderboard = lazy(() => import("./pages/public/PublicLeaderboard"));
const CompanyPublicProjects = lazy(() => import("./pages/public/CompanyPublicProjects"));
const PublicBlog = lazy(() => import("./pages/PublicBlog"));
const PublicBlogPost = lazy(() => import("./pages/PublicBlogPost"));
const Pricing = lazy(() => import("./pages/public/Pricing"));
const PublicAgentsIndex = lazy(() => import("./pages/public/PublicAgentsIndex"));

// Gro10x shell (entire B2B super-app)
const Gro10xRoutes = lazy(() =>
  import("./gro10x/Gro10xRoutes").then((m) => ({ default: m.Gro10xRoutes }))
);

// Admin pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardChat = lazy(() => import("./pages/DashboardChat"));
const AdminMessagingInbox = lazy(() => import("./pages/AdminMessagingInbox"));
const Students = lazy(() => import("./pages/Students"));
const Enrollments = lazy(() => import("./pages/Enrollments"));
const Instructors = lazy(() => import("./pages/Instructors"));
const InstructorNew = lazy(() => import("./pages/InstructorNew"));
const InstructorEdit = lazy(() => import("./pages/InstructorEdit"));
const Sessions = lazy(() => import("./pages/Sessions"));
const SessionNew = lazy(() => import("./pages/SessionNew"));
const SessionEdit = lazy(() => import("./pages/SessionEdit"));
const ContentNew = lazy(() => import("./pages/ContentNew"));
const ContentEdit = lazy(() => import("./pages/ContentEdit"));
const QuizManagement = lazy(() => import("./pages/QuizManagement"));
const ModuleManagement = lazy(() => import("./pages/ModuleManagement"));
const ModuleResourcesManager = lazy(() => import("./pages/ModuleResourcesManager"));
const Organization = lazy(() => import("./pages/Organization"));
const WorkforceFleet = lazy(() => import("./pages/admin/WorkforceFleet"));
const AdminLiveInbox = lazy(() => import("./pages/AdminLiveInbox"));

// Talent app pages (all lazy)
const Feed = lazy(() => import("./pages/app/Feed"));
const PostDetail = lazy(() => import("./pages/app/PostDetail"));
const CreatorAnalytics = lazy(() => import("./pages/app/CreatorAnalytics"));
const LearningHub = lazy(() => import("./pages/app/LearningHub"));
const LearningReview = lazy(() => import("./pages/LearningReview"));
const JobsHub = lazy(() => import("./pages/app/JobsHub"));
const AIAgents = lazy(() => import("./pages/app/AIAgents"));
const MyAgents = lazy(() => import("./pages/app/MyAgents"));
const AgentMarketplace = lazy(() => import("./pages/app/AgentMarketplace"));
const AgentChat = lazy(() => import("./pages/app/AgentChat"));
const AIGeneral = lazy(() => import("./pages/app/AIGeneral"));
const CareerCoach = lazy(() => import("./pages/app/CareerCoach"));
const Profile = lazy(() => import("./pages/app/Profile"));
const ProfileEdit = lazy(() => import("./pages/app/ProfileEdit"));
const ProfileBuilder = lazy(() => import("@/pages/app/ProfileBuilder"));
const TalentHome = lazy(() => import("./pages/app/TalentHome"));
const TalentPitches = lazy(() => import("./pages/app/TalentPitches"));
const Messages = lazy(() => import("./pages/app/Messages"));
const MessageThread = lazy(() => import("./pages/app/MessageThread"));
const AgentProfile = lazy(() => import("./pages/app/AgentProfile"));
const MyResults = lazy(() => import("./pages/app/MyResults"));
const MyApplications = lazy(() => import("./pages/app/MyApplications"));
const AppApplicationDetail = lazy(() => import("./pages/app/AppApplicationDetail"));
const AppInterviewSchedule = lazy(() => import("./pages/app/AppInterviewSchedule"));
const AppOfferDecision = lazy(() => import("./pages/app/AppOfferDecision"));
const SavedItems = lazy(() => import("./pages/app/SavedItems"));
const Gigs = lazy(() => import("./pages/app/Gigs"));
const NewGigWizard = lazy(() => import("./pages/app/NewGigWizard"));
const GigAppeals = lazy(() => import("./pages/app/GigAppeals"));
const GigDisputes = lazy(() => import("./pages/app/GigDisputes"));
const ReviewerCockpit = lazy(() => import("./pages/app/ReviewerCockpit"));
const MyProjects = lazy(() => import("./pages/app/MyProjects"));
const ProjectRoom = lazy(() => import("./pages/app/ProjectRoom"));
const MarketplaceGigDetail = lazy(() => import("./pages/app/MarketplaceGigDetail"));
const Transactions = lazy(() => import("./pages/app/Transactions"));
const Withdrawals = lazy(() => import("./pages/app/Withdrawals"));
const TalentDirectory = lazy(() => import("./pages/app/TalentDirectory"));
const TalentPublicProfile = lazy(() => import("./pages/app/TalentPublicProfile"));
const Connections = lazy(() => import("./pages/app/Connections"));
const ProfileVerify = lazy(() => import("./pages/app/ProfileVerify"));
const CVMaker = lazy(() => import("./pages/app/tools/CVMaker"));
const ApplicationHelper = lazy(() => import("./pages/app/tools/ApplicationHelper"));
const AppJobs = lazy(() => import("./pages/app/AppJobs"));
const AppJobDetail = lazy(() => import("./pages/app/AppJobDetail"));
const CourseProjectDetail = lazy(() => import("./pages/app/CourseProjectDetail"));
const AppJobApplication = lazy(() => import("./pages/app/AppJobApplication"));
const AppCourses = lazy(() => import("./pages/app/AppCourses"));
const AppCourseDetail = lazy(() => import("./pages/app/AppCourseDetail"));
const AppMyLearning = lazy(() => import("./pages/app/AppMyLearning"));
const TalentMirror = lazy(() => import("./pages/app/TalentMirror"));
const InstructorReviewQueue = lazy(() => import("./pages/app/InstructorReviewQueue"));
const InstructorInsights = lazy(() => import("./pages/app/InstructorInsights"));
const InstructorShell = lazy(() => import("./pages/app/instructor/InstructorShell"));
const InstructorCourseSessions = lazy(() => import("./pages/app/instructor/InstructorCourseSessions"));
const AppCohortHome = lazy(() => import("./pages/app/AppCohortHome"));
const AppSessionJoin = lazy(() => import("./pages/app/AppSessionJoin"));
const AppCohortDiscussions = lazy(() => import("./pages/app/AppCohortDiscussions"));
const AppDiscussionThread = lazy(() => import("./pages/app/AppDiscussionThread"));
const AppReviewQueue = lazy(() => import("./pages/app/AppReviewQueue"));
const AppSubmissionDetail = lazy(() => import("./pages/app/AppSubmissionDetail"));
const AppProfessions = lazy(() => import("./pages/app/AppProfessions"));
const AppProfessionDetail = lazy(() => import("./pages/app/AppProfessionDetail"));
const SchoolDetail = lazy(() => import("./pages/app/SchoolDetail"));
const AppEvents = lazy(() => import("./pages/app/AppEvents"));
const ImmersiveCoursePlayer = lazy(() => import("./pages/ImmersiveCoursePlayer"));
const Quiz = lazy(() => import("./pages/Quiz"));
const ReportCard = lazy(() => import("./pages/ReportCard"));
const JobAssessment = lazy(() => import("./pages/app/JobAssessment"));
const JobAssessmentResults = lazy(() => import("./pages/app/JobAssessmentResults"));

// Services
const AppCareerAssessment = lazy(() => import("./pages/app/AppCareerAssessment"));
const AppMockInterviewSetup = lazy(() => import("./pages/app/AppMockInterviewSetup"));
const AppSalaryAnalysisSetup = lazy(() => import("./pages/app/AppSalaryAnalysisSetup"));
const AppPortfolioRequest = lazy(() => import("./pages/app/AppPortfolioRequest"));

// Mock interview + salary public flows
const MockInterview = lazy(() => import("./pages/MockInterview"));
const MockInterviewSetup = lazy(() => import("./pages/MockInterviewSetup"));
const MockInterviewQuestions = lazy(() => import("./pages/MockInterviewQuestions"));
const MockInterviewCapture = lazy(() => import("./pages/MockInterviewCapture"));
const MockInterviewResults = lazy(() => import("./pages/MockInterviewResults"));
const SalaryAnalysis = lazy(() => import("./pages/SalaryAnalysis"));
const SalaryAnalysisSetup = lazy(() => import("./pages/SalaryAnalysisSetup"));
const SalaryAnalysisProcessing = lazy(() => import("./pages/SalaryAnalysisProcessing"));
const SalaryAnalysisResults = lazy(() => import("./pages/SalaryAnalysisResults"));

// Study abroad + blog
const StudyAbroad = lazy(() => import("./pages/app/StudyAbroad"));
const StudyAbroadDetail = lazy(() => import("./pages/app/StudyAbroadDetail"));
const StudyAbroadRoadmapResults = lazy(() => import("./pages/app/StudyAbroadRoadmapResults"));
const IELTSPrep = lazy(() => import("./pages/app/IELTSPrep"));
const AbroadHub = lazy(() => import("./pages/app/AbroadHub"));
const DestinationAgentPage = lazy(() => import("./pages/app/DestinationAgentPage"));
const AbroadApplications = lazy(() => import("./pages/app/AbroadApplications"));
const AbroadCounsellor = lazy(() => import("./pages/app/AbroadCounsellor"));
const IELTSCoach = lazy(() => import("./pages/app/IELTSCoach"));
const IELTSMockRunner = lazy(() => import("./pages/app/IELTSMockRunner"));
const IELTSResults = lazy(() => import("./pages/app/IELTSResults"));
const LanguagesHub = lazy(() => import("./pages/app/LanguagesHub"));
const LanguagePracticePage = lazy(() => import("./pages/app/LanguagePracticePage"));
const LanguageInstructorsPage = lazy(() => import("./pages/app/LanguageInstructorsPage"));
const Competitions = lazy(() => import("./pages/app/Competitions"));
const CompetitionDetail = lazy(() => import("./pages/app/CompetitionDetail"));
const Blog = lazy(() => import("./pages/app/Blog"));
const BlogPost = lazy(() => import("./pages/app/BlogPost"));
const Unsubscribe = lazy(() => import("./pages/app/Unsubscribe"));

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

// Force new talents into the conversational profile builder (Aisha),
// and gate legacy users (missing reference FKs) behind the AccountUpgradeModal.
const OnboardingGuard = ({ children }: { children: React.ReactNode }) => {
  const { talent, isTalentLoading, refreshTalent } = useTalent();
  const location = useLocation();

  if (isTalentLoading && !talent) return <>{children}</>;

  const needsOnboarding = !!talent && !talent.onboardingCompletedAt;
  const onBuilder = location.pathname.startsWith("/app/profile-builder");

  if (needsOnboarding) {
    if (talent.onboardingStep !== 4) {
      return <Navigate to="/start" replace />;
    }
    if (!onBuilder) {
      return <Navigate to="/app/profile-builder" replace />;
    }
  }

  const needsUpgrade = !!talent && !!talent.onboardingCompletedAt && !talent.careerStageId;

  if (needsUpgrade) {
    return (
      <>
        {children}
        <AccountUpgradeModal open onComplete={() => refreshTalent()} />
      </>
    );
  }

  const needsPhone =
    !!talent &&
    !!talent.onboardingCompletedAt &&
    !(talent.phone && talent.phone.trim().length > 0);

  if (needsPhone) {
    return (
      <>
        {children}
        <PhoneCaptureModal open onComplete={() => refreshTalent()} />
      </>
    );
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <BootGate>
            <ImpersonationProvider>
            <TalentProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <PWAInstallPrompt />
                <PWAUpdatePrompt />

                <Suspense fallback={<PageLoadingSkeleton />}>
                <Routes>
                  {/* ================= PUBLIC ROUTES ================= */}
                  <Route path="/" element={IS_GRO10X ? <Navigate to="/gro10x" replace /> : <Index />} />
                  <Route path="/auth" element={<AuthChat />} />
                  <Route path="/auth/classic" element={<AuthClassic />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/start" element={<Start />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/pricing" element={<Pricing />} />

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
                  <Route path="/ir/view/:token" element={<IRDocumentViewer />} />
                  <Route path="/t/:handle" element={<PublicTalentProfile />} />

                  {/* Phase 5.6 — public discovery */}
                  <Route path="/agents" element={<PublicAgentsIndex />} />
                  <Route path="/explore/agents" element={<PublicAgentsIndex />} />
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
                  <Route
                    path="/admin/workforce"
                    element={
                      <ProtectedRoute requireAnyAdminRole>
                        <WorkforceFleet />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/inbox"
                    element={
                      <ProtectedRoute requireAnyAdminRole>
                        <AdminLiveInbox />
                      </ProtectedRoute>
                    }
                  />
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
                  <Route path="/students" element={<ProtectedRoute requireAdmin><Students /></ProtectedRoute>} />
                  <Route path="/enrollments" element={<ProtectedRoute requireAdmin><Enrollments /></ProtectedRoute>} />
                  <Route path="/instructors" element={<ProtectedRoute><Instructors /></ProtectedRoute>} />
                  <Route path="/instructors/new" element={<ProtectedRoute requireAdmin><InstructorNew /></ProtectedRoute>} />
                  <Route path="/instructors/:id/edit" element={<ProtectedRoute requireAdmin><InstructorEdit /></ProtectedRoute>} />
                  <Route path="/sessions" element={<ProtectedRoute requireAdmin><Sessions /></ProtectedRoute>} />
                  <Route path="/sessions/new" element={<ProtectedRoute requireAdmin><SessionNew /></ProtectedRoute>} />
                  <Route path="/sessions/:id/edit" element={<ProtectedRoute requireAdmin><SessionEdit /></ProtectedRoute>} />
                  <Route path="/content/new" element={<ProtectedRoute requireAdmin><ContentNew /></ProtectedRoute>} />
                  <Route path="/content/:id/edit" element={<ProtectedRoute requireAdmin><ContentEdit /></ProtectedRoute>} />
                  <Route path="/quiz-manage/:contentId" element={<ProtectedRoute requireAdmin><QuizManagement /></ProtectedRoute>} />
                  <Route path="/content/:contentId/modules" element={<ProtectedRoute requireAdmin><ModuleManagement /></ProtectedRoute>} />
                  <Route path="/content/:contentId/modules/:moduleId/resources" element={<ProtectedRoute requireAdmin><ModuleResourcesManager /></ProtectedRoute>} />
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
                    <Route path="abroad/destinations/:country" element={<DestinationGate />} />
                    <Route path="abroad/applications" element={<ComingSoonGate featureKey="abroad-applications" title="Abroad Applications coming soon" description="We're connecting partner consultancies in your destination. Join the waitlist and we'll notify you the moment we open." secondaryCtaLabel="Back to Study Abroad" secondaryCtaHref="/app/abroad" />} />
                    <Route path="counsellor" element={<ComingSoonGate featureKey="abroad-counsellor" title="Abroad Counsellor coming soon" description="Our certified abroad counsellors are coming online. Sign up to claim an early slot." secondaryCtaLabel="Back to Study Abroad" secondaryCtaHref="/app/abroad" />} />
                    <Route path="abroad/ielts" element={<IELTSCoach />} />
                    <Route path="abroad/ielts/mock/:section" element={<IELTSMockRunner />} />
                    <Route path="abroad/ielts/results/:id" element={<IELTSResults />} />
                    <Route path="languages" element={<LanguagesHub />} />
                    <Route path="languages/:code/practice" element={<LanguagePracticePage />} />
                    <Route path="languages/:code/instructors" element={<LanguageInstructorsPage />} />
                    <Route path="agents" element={<AIAgents />} />
                    <Route path="my-agents" element={<MyAgents />} />
                    <Route path="agent-marketplace" element={<ComingSoonGate featureKey="agent-marketplace" title="Agent Marketplace coming soon" description="A curated marketplace of AI agents built by our community is on the way. Join the waitlist for first access." secondaryCtaLabel="Explore AI Agents" secondaryCtaHref="/app/agents" />} />
                    <Route path="gigs" element={<Gigs />} />
                    <Route path="gigs/new" element={<NewGigWizard />} />
                    <Route path="gigs/appeals" element={<GigAppeals />} />
                    <Route path="gigs/disputes" element={<GigDisputes />} />
                    <Route path="reviewer" element={<ReviewerCockpit />} />
                    <Route path="projects" element={<ComingSoonGate featureKey="talent-projects" title="Managed Projects coming soon" description="Team up on funded, escrow-backed projects. Join the waitlist and we'll match you to the first cohort." secondaryCtaLabel="Browse Gigs" secondaryCtaHref="/app/gigs" />} />
                    <Route path="projects/:projectId" element={<ComingSoonGate featureKey="talent-projects" title="Managed Projects coming soon" description="Team up on funded, escrow-backed projects. Join the waitlist and we'll match you to the first cohort." secondaryCtaLabel="Browse Gigs" secondaryCtaHref="/app/gigs" />} />
                    <Route path="marketplace" element={<Navigate to="/app/gigs?tab=projects" replace />} />
                    <Route path="marketplace/:id" element={<MarketplaceGigDetail />} />
                    <Route path="my-gigs" element={<Navigate to="/app/gigs?tab=activity" replace />} />
                    <Route path="me" element={<TalentHome />} />
                    <Route path="pitches" element={<TalentPitches />} />
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
                    <Route path="learning/competitions" element={<ComingSoonGate featureKey="learning-competitions" title="Competitions coming soon" description="Skill-building competitions with cash and credit prizes are launching shortly. Get notified at launch." secondaryCtaLabel="Back to Learning" secondaryCtaHref="/app/learning" />} />
                    <Route path="learning/competitions/:slug" element={<ComingSoonGate featureKey="learning-competitions" title="Competitions coming soon" description="Skill-building competitions with cash and credit prizes are launching shortly. Get notified at launch." secondaryCtaLabel="Back to Learning" secondaryCtaHref="/app/learning" />} />
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
                    <Route path="profile-builder" element={<ProfileBuilder />} />
                    <Route path="agents/:agentKey/profile" element={<AgentProfile />} />
                    <Route path="agents/:agentKey" element={<AgentChat />} />
                    <Route path="ai-general" element={<AIGeneral />} />
                    <Route path="career-coach" element={<CareerCoach />} />
                    <Route path="transactions" element={<Transactions />} />
                    <Route path="withdrawals" element={<Withdrawals />} />
                    <Route path="profile/verify" element={<ProfileVerify />} />

                    <Route path="tools/cv-maker" element={<CVMaker />} />
                    <Route path="tools/application-helper" element={<ApplicationHelper />} />
                    <Route path="tools/assessment" element={<AppCareerAssessment />} />
                    <Route path="tools/mock-interview" element={<AppMockInterviewSetup />} />
                    <Route path="tools/salary-analysis" element={<AppSalaryAnalysisSetup />} />
                    <Route path="tools/portfolio" element={<AppPortfolioRequest />} />

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
                </Suspense>
              </TooltipProvider>
            </TalentProvider>
            </ImpersonationProvider>
          </BootGate>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
