import { Toaster } from "@/components/ui/toaster";
import AppMyLearning from "./pages/app/AppMyLearning";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BootGate } from "@/components/BootGate";
import { TalentProvider } from "@/contexts/TalentContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import CourseDetail from "./pages/CourseDetail";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Enrollments from "./pages/Enrollments";
import ContentNew from "./pages/ContentNew";
import ContentEdit from "./pages/ContentEdit";
import ImmersiveCoursePlayer from "./pages/ImmersiveCoursePlayer";
import Quiz from "./pages/Quiz";
import QuizManagement from "./pages/QuizManagement";
import ModuleManagement from "./pages/ModuleManagement";
import ModuleResourcesManager from "./pages/ModuleResourcesManager";
import ReportCard from "./pages/ReportCard";
import Instructors from "./pages/Instructors";
import InstructorNew from "./pages/InstructorNew";
import InstructorEdit from "./pages/InstructorEdit";
import Sessions from "./pages/Sessions";
import SessionNew from "./pages/SessionNew";
import SessionEdit from "./pages/SessionEdit";
import CareerAssessment from "./pages/CareerAssessment";
import AssessmentResults from "./pages/AssessmentResults";
import PortfolioRequest from "./pages/PortfolioRequest";
import PortfolioStatus from "./pages/PortfolioStatus";
import MockInterview from "./pages/MockInterview";
import MockInterviewSetup from "./pages/MockInterviewSetup";
import MockInterviewQuestions from "./pages/MockInterviewQuestions";
import MockInterviewCapture from "./pages/MockInterviewCapture";
import MockInterviewResults from "./pages/MockInterviewResults";
import SalaryAnalysis from "./pages/SalaryAnalysis";
import SalaryAnalysisSetup from "./pages/SalaryAnalysisSetup";
import SalaryAnalysisProcessing from "./pages/SalaryAnalysisProcessing";
import SalaryAnalysisResults from "./pages/SalaryAnalysisResults";
import Organization from "./pages/Organization";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

// New App Shell Pages
import { TalentAppShell } from "./layouts/TalentAppShell";
import Feed from "./pages/app/Feed";
import LearningHub from "./pages/app/LearningHub";
import ServicesHub from "./pages/app/ServicesHub";
import JobsHub from "./pages/app/JobsHub";
import CareerAbroad from "./pages/app/CareerAbroad";
import AIAgents from "./pages/app/AIAgents";
import AgentChat from "./pages/app/AgentChat";
import Profile from "./pages/app/Profile";
import AppJobDetail from "./pages/app/AppJobDetail";
import AppProfessions from "./pages/app/AppProfessions";
import AppProfessionDetail from "./pages/app/AppProfessionDetail";
import AppCourses from "./pages/app/AppCourses";
import AppCourseDetail from "./pages/app/AppCourseDetail";
import AppCareerAssessment from "./pages/app/AppCareerAssessment";
import AppMockInterviewSetup from "./pages/app/AppMockInterviewSetup";
import AppSalaryAnalysisSetup from "./pages/app/AppSalaryAnalysisSetup";
import AppPortfolioRequest from "./pages/app/AppPortfolioRequest";
import AppEvents from "./pages/app/AppEvents";
import MyResults from "./pages/app/MyResults";
import MyApplications from "./pages/app/MyApplications";
import ProfileEdit from "./pages/app/ProfileEdit";
import AppJobs from "./pages/app/AppJobs";
import AppJobApplication from "./pages/app/AppJobApplication";
import Notifications from "./pages/app/Notifications";
import StudyAbroad from "./pages/app/StudyAbroad";
import StudyAbroadDetail from "./pages/app/StudyAbroadDetail";
import IELTSPrep from "./pages/app/IELTSPrep";
import Competitions from "./pages/app/Competitions";
import CompetitionDetail from "./pages/app/CompetitionDetail";
import Blog from "./pages/app/Blog";
import BlogPost from "./pages/app/BlogPost";

// Configure QueryClient with global defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes("timed out")) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BootGate>
          <TalentProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  
                  {/* Redirect old public routes to auth with returnTo */}
                  <Route path="/courses" element={<Navigate to="/auth?returnTo=/app/learning/courses" replace />} />
                  <Route path="/professions" element={<Navigate to="/auth?returnTo=/app/learning/tracks" replace />} />
                  <Route path="/professions/:slug" element={<Navigate to="/auth?returnTo=/app/learning/tracks" replace />} />
                  <Route path="/career-services" element={<Navigate to="/auth?returnTo=/app/services" replace />} />
                  <Route path="/jobs" element={<Navigate to="/auth?returnTo=/app/jobs" replace />} />
                  
                  {/* Keep access code flows public for standalone services */}
                  <Route path="/career-assessment" element={<CareerAssessment />} />
                  <Route path="/assessment-results/:id" element={<AssessmentResults />} />
                  <Route path="/portfolio-request" element={<PortfolioRequest />} />
                  <Route path="/portfolio-status" element={<PortfolioStatus />} />
                  <Route path="/mock-interview" element={<MockInterview />} />
                  <Route path="/mock-interview/setup" element={<MockInterviewSetup />} />
                  <Route path="/mock-interview/questions/:id" element={<MockInterviewQuestions />} />
                  <Route path="/mock-interview/capture/:id" element={<MockInterviewCapture />} />
                  <Route path="/mock-interview/results/:id" element={<MockInterviewResults />} />
                  <Route path="/salary-analysis" element={<SalaryAnalysis />} />
                  <Route path="/salary-analysis/setup" element={<SalaryAnalysisSetup />} />
                  <Route path="/salary-analysis/processing/:id" element={<SalaryAnalysisProcessing />} />
                  <Route path="/salary-analysis/results/:id" element={<SalaryAnalysisResults />} />
                  
                  {/* Keep blog public for SEO */}
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  
                  {/* Job detail with redirect */}
                  <Route path="/jobs/:id" element={<Navigate to="/auth?returnTo=/app/jobs" replace />} />
                  <Route path="/jobs/:id/apply" element={<Navigate to="/auth?returnTo=/app/jobs" replace />} />
                  
                  <Route path="/my-profile" element={<Navigate to="/app/profile" replace />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute requireAnyAdminRole>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  {/* Legacy route - redirect to app shell */}
                  <Route
                    path="/my-learning"
                    element={<Navigate to="/app/learning/my-courses" replace />}
                  />
                  <Route path="/courses/:slug" element={<CourseDetail />} />
                  <Route
                    path="/learn/:slug"
                    element={
                      <ProtectedRoute>
                        <ImmersiveCoursePlayer />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/quiz/:slug"
                    element={
                      <ProtectedRoute>
                        <Quiz />
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
                  <Route
                    path="/report-card/:enrollmentId"
                    element={
                      <ProtectedRoute>
                        <ReportCard />
                      </ProtectedRoute>
                    }
                  />
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
                  {/* Organization placeholder */}
                  <Route path="/org" element={<Organization />} />
                  
                  {/* New authenticated app shell routes */}
                  <Route path="/app" element={<Navigate to="/app/feed" replace />} />
                  <Route
                    path="/app/*"
                    element={
                      <ProtectedRoute>
                        <TalentAppShell />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="feed" element={<Feed />} />
                    <Route path="learning" element={<LearningHub />} />
                    <Route path="learning/tracks" element={<AppProfessions />} />
                    <Route path="learning/tracks/:slug" element={<AppProfessionDetail />} />
                    <Route path="learning/courses" element={<AppCourses />} />
                    <Route path="learning/courses/:slug" element={<AppCourseDetail />} />
                    <Route path="learning/my-courses" element={<AppMyLearning />} />
                    <Route path="learning/events" element={<AppEvents />} />
                    <Route path="services" element={<ServicesHub />} />
                    <Route path="services/assessment" element={<AppCareerAssessment />} />
                    <Route path="services/mock-interview" element={<AppMockInterviewSetup />} />
                    <Route path="services/salary-analysis" element={<AppSalaryAnalysisSetup />} />
                    <Route path="services/portfolio" element={<AppPortfolioRequest />} />
                    <Route path="jobs" element={<JobsHub />} />
                    <Route path="jobs/all" element={<AppJobs />} />
                    <Route path="jobs/:id" element={<AppJobDetail />} />
                    <Route path="jobs/:id/apply" element={<AppJobApplication />} />
                    <Route path="applications" element={<MyApplications />} />
                    <Route path="abroad" element={<CareerAbroad />} />
                    <Route path="abroad/study" element={<StudyAbroad />} />
                    <Route path="abroad/study/:id" element={<StudyAbroadDetail />} />
                    <Route path="abroad/ielts" element={<IELTSPrep />} />
                    <Route path="learning/competitions" element={<Competitions />} />
                    <Route path="learning/competitions/:slug" element={<CompetitionDetail />} />
                    <Route path="learning/blog" element={<Blog />} />
                    <Route path="learning/blog/:slug" element={<BlogPost />} />
                    <Route path="agents" element={<AIAgents />} />
                    <Route path="agents/:agentKey" element={<AgentChat />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="profile/edit" element={<ProfileEdit />} />
                    <Route path="services/my-results" element={<MyResults />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="learn/:slug" element={<ImmersiveCoursePlayer />} />
                  </Route>
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </TalentProvider>
        </BootGate>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
