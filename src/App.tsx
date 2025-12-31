import { Toaster } from "@/components/ui/toaster";
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
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Dashboard from "./pages/Dashboard";
import MyLearning from "./pages/MyLearning";
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
import CareerServices from "./pages/CareerServices";
import AssessmentResults from "./pages/AssessmentResults";
import PortfolioRequest from "./pages/PortfolioRequest";
import PortfolioStatus from "./pages/PortfolioStatus";
import MockInterview from "./pages/MockInterview";
import MockInterviewSetup from "./pages/MockInterviewSetup";
import MockInterviewQuestions from "./pages/MockInterviewQuestions";
import MockInterviewCapture from "./pages/MockInterviewCapture";
import MockInterviewResults from "./pages/MockInterviewResults";
import Professions from "./pages/Professions";
import ProfessionDetail from "./pages/ProfessionDetail";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import JobApplication from "./pages/JobApplication";
import SalaryAnalysis from "./pages/SalaryAnalysis";
import SalaryAnalysisSetup from "./pages/SalaryAnalysisSetup";
import SalaryAnalysisProcessing from "./pages/SalaryAnalysisProcessing";
import SalaryAnalysisResults from "./pages/SalaryAnalysisResults";
import TalentPortal from "./pages/TalentPortal";
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
import Profile from "./pages/app/Profile";

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
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/professions" element={<Professions />} />
                  <Route path="/professions/:slug" element={<ProfessionDetail />} />
                  <Route path="/career-services" element={<CareerServices />} />
                  <Route path="/career-assessment" element={<CareerAssessment />} />
                  <Route path="/assessment-results/:id" element={<AssessmentResults />} />
                  <Route path="/portfolio-request" element={<PortfolioRequest />} />
                  <Route path="/portfolio-status" element={<PortfolioStatus />} />
                  <Route path="/mock-interview" element={<MockInterview />} />
                  <Route path="/mock-interview/setup" element={<MockInterviewSetup />} />
                  <Route path="/mock-interview/questions/:id" element={<MockInterviewQuestions />} />
                  <Route path="/mock-interview/capture/:id" element={<MockInterviewCapture />} />
                  <Route path="/mock-interview/results/:id" element={<MockInterviewResults />} />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/jobs/:id" element={<JobDetail />} />
                  <Route path="/jobs/:id/apply" element={<JobApplication />} />
                  <Route path="/salary-analysis" element={<SalaryAnalysis />} />
                  <Route path="/salary-analysis/setup" element={<SalaryAnalysisSetup />} />
                  <Route path="/salary-analysis/processing/:id" element={<SalaryAnalysisProcessing />} />
                  <Route path="/salary-analysis/results/:id" element={<SalaryAnalysisResults />} />
                  <Route path="/my-profile" element={<TalentPortal />} />
                  <Route path="/courses/:slug" element={<CourseDetail />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute requireAnyAdminRole>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-learning"
                    element={
                      <ProtectedRoute>
                        <MyLearning />
                      </ProtectedRoute>
                    }
                  />
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
                    <Route path="services" element={<ServicesHub />} />
                    <Route path="jobs" element={<JobsHub />} />
                    <Route path="abroad" element={<CareerAbroad />} />
                    <Route path="agents" element={<AIAgents />} />
                    <Route path="profile" element={<Profile />} />
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
