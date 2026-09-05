import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Index from "./pages/Index";
import AppLayout from "./components/layout/AppLayout";
import PublicLayout from "./components/layout/PublicLayout";
import AdminLayout from "./components/layout/AdminLayout";
import Dashboard from "./pages/Dashboard";
import ForestTimerPage from "./pages/ForestTimerPage";
import Tests from "./pages/Tests";
import Results from "./pages/Results";
import Leaderboard from "./pages/Leaderboard";
import Resources from "./pages/Resources";
import Olympiads from "./pages/Olympiads";
import OlympiadDetails from "./pages/OlympiadDetails";
import OlympiadExam from "./pages/OlympiadExam";


import Support from "./pages/Support";
import NotificationsPage from "./pages/NotificationsPage";
import TestDetails from "./pages/TestDetails";
import Offerta from "./pages/Offerta";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import UnderConstruction from "./pages/UnderConstruction";
import AiChat from "./pages/AiChat";

import MyErrors from "./pages/MyErrors";
import CompleteProfile from "./pages/CompleteProfile";
import Certification from "./pages/Certification";
import CertificationApply from "./pages/CertificationApply";
import Portfolio from "./pages/Portfolio";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminTests from "./pages/admin/AdminTests";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminComplaints from "./pages/admin/AdminComplaints";
import AdminFeedback from "./pages/admin/AdminFeedback";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminMockTests from "./pages/admin/AdminMockTests";
import AdminUniversities from "./pages/admin/AdminUniversities";
import CreateMockTest from "./pages/admin/CreateMockTest";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminCatalog from "./pages/admin/AdminCatalog";
import AdminGuide from "./pages/admin/AdminGuide";
import CreateTest from "./pages/admin/CreateTest";
import BuilderTest from "./pages/admin/BuilderTest";
import AdminModeration from "./pages/admin/AdminModeration";
import BuilderTestSession from "./pages/BuilderTestSession";

import AccountSettings from "./pages/AccountSettings";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import CourseLesson from "./pages/CourseLesson";
import CourseTest from "./pages/CourseTest";
import CourseCreator from "./pages/CourseCreator";
import Qollanmalar from "./pages/Qollanmalar";
import ScoreCalculator from "./pages/ScoreCalculator";
import MockTests from "./pages/MockTests";
import MockTestSession from "./pages/MockTestSession";
import MockTestInfo from "./pages/MockTestInfo";
import Planner from "./pages/Planner";
import RegistrationSurvey from "./pages/RegistrationSurvey";
import MathSolver from "./pages/MathSolver";
import EssayChecker from "./pages/EssayChecker";
import AiMentor from "./pages/AiMentor";
import Vocabulary from "./pages/Vocabulary";
import Taqdimot from "./pages/Taqdimot";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import Universitetlar from "./pages/Universitetlar";
import AdminBlog from "./pages/admin/AdminBlog";
import ContributorPage from "./pages/ContributorPage";
import AIGenerateQuestions from "./pages/AIGenerateQuestions";
import GrowmockVS from "./pages/GrowmockVS";
import ChatgptVS from "./pages/ChatgptVS";
import MilliyMockVS from "./pages/MilliyMockVS";
import PdfImport from "./pages/admin/PdfImport";
import { EduCoinProvider } from "./hooks/useEduCoin";
import { DailyLoginModal, FeedbackModal } from "./components/educoin/EduCoinModals";
import NotificationModal from "./components/notifications/NotificationModal";
import { ExitIntentModal } from "./components/ExitIntentModal";

import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeCustomizerProvider } from "./components/ThemeCustomizerProvider";
import ThemeCustomizer from "./components/ThemeCustomizer";

import RequireAuth from "./components/RequireAuth";
import HashScrollHandler from "./components/routing/HashScrollHandler";
import { SubjectProvider } from "./hooks/useSubject";
import { usePageTracking } from "./hooks/usePageTracking";
import { useYandexMetrikaPageView } from "./hooks/useYandexMetrikaPageView";
import { metrica } from "./lib/metrica";

// Tracks every route change → writes to page_views & active_sessions
const RouterTracker = () => { usePageTracking(); return null; };

// Tracks every route change → sends ym("hit", ...) to Yandex.Metrika
const YmTracker = () => { useYandexMetrikaPageView(); return null; };

const StudentComingSoon = () => (
  <UnderConstruction title="O'quvchi bo'limi tez orada ishga tushadi" />
);

import { useState, useEffect } from "react";
import OfflineGame from "./components/OfflineGame";
import VocabRunnerPage from "./pages/VocabRunnerPage";
import YandexMetrika from "./components/YandexMetrika";
import OneSignalPrompt from "./components/OneSignalPrompt";
import { useDeviceBlock } from "@/hooks/useDeviceBlock";
import BlockedDeviceScreen from "@/components/BlockedDeviceScreen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

import { useAuth } from "@/hooks/useAuth";

// Qurilma yoki profil bloklangan bo'lsa hamma narsani berkitadi
const DeviceBlockGuard = ({ children }: { children: React.ReactNode }) => {
  const { isDeviceBlocked, isChecking } = useDeviceBlock();
  const { profile } = useAuth();

  if (isDeviceBlocked || profile?.is_blocked) {
    return <BlockedDeviceScreen />;
  }

  if (isChecking) return <>{children}</>;
  return <>{children}</>;
};

function AIGenerateQuestionsWrapper() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const folderId = searchParams.get("folderId") || "";
  const folderName = searchParams.get("folderName") || "";
  const subject = searchParams.get("subject") || "";
  return (
    <AIGenerateQuestions
      folderId={folderId}
      folderName={folderName}
      subject={subject}
      onBack={() => navigate("/tests/contributor")}
    />
  );
}

const App = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  console.log(
    `%c
███████╗██████╗ ██╗   ██╗ ██████╗ ██████╗ ███╗   ██╗████████╗███████╗███████╗████████╗
██╔════╝██╔══██╗██║   ██║██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝
█████╗  ██║  ██║██║   ██║██║     ██║   ██║██╔██╗ ██║   ██║   █████╗  ███████╗   ██║
██╔══╝  ██║  ██║██║   ██║██║     ██║   ██║██║╚██╗██║   ██║   ██╔══╝  ╚════██║   ██║
███████╗██████╔╝╚██████╔╝╚██████╗╚██████╔╝██║ ╚████║   ██║   ███████╗███████║   ██║
╚══════╝╚═════╝  ╚═════╝  ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚══════╝   ╚═╝

%ceducontest.uz`,
    "color:#E8192C;font-family:monospace;font-size:10px;font-weight:bold;",
    "color:#3B82F6;font-size:12px;"
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Track funnel: landing page visit (once per session)
    if (!sessionStorage.getItem("ec_funnel_landing")) {
      sessionStorage.setItem("ec_funnel_landing", "1");
      metrica.funnelLanding();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <YandexMetrika />
      <OneSignalPrompt />
      {!isOnline && <OfflineGame />}
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="vite-ui-theme">
        <ThemeCustomizerProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <HashScrollHandler />
              <AuthProvider>
                <DeviceBlockGuard>
                <RouterTracker />
                <YmTracker />
                <SubjectProvider>
                  <EduCoinProvider>
                    <DailyLoginModal />
                    <FeedbackModal />
                    <NotificationModal />
                    <ExitIntentModal />
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/bosh/:section" element={<Index />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/offerta" element={<Offerta />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/complete-profile" element={<CompleteProfile />} />
                      <Route path="/onboarding" element={<RegistrationSurvey />} />
                      <Route path="/onboarding/:stepSlug" element={<RegistrationSurvey />} />
                      <Route element={<PublicLayout />}>
                        {/* Public routes - login kerak emas */}
                        <Route path="/test" element={<Navigate to="/tests" replace />} />
                        <Route path="/tests" element={<Tests />} />
                        <Route path="/tests/folder/:id" element={<TestDetails />} />
                        <Route path="/tests/:subjectSlug" element={<Tests />} />
                        <Route path="/tests/:subjectSlug/:chapterSlug" element={<Tests />} />
                        <Route path="/tests/:subjectSlug/:chapterSlug/:folderSlug" element={<Tests />} />
                        <Route path="/tests/details/:id" element={<TestDetails />} />
                        <Route path="/qollanmalar" element={<Qollanmalar />} />
                        <Route path="/courses" element={<Courses />} />
                        <Route path="/courses/:category" element={<Courses />} />
                        <Route path="/mock-tests" element={<Navigate to="/tests?type=mock" replace />} />
                        <Route path="/blog" element={<Blog />} />
                        <Route path="/blog/:slug" element={<BlogDetail />} />

                        {/* Login talab qilinadigan routes */}
                        <Route path="/forest-timer" element={<RequireAuth><ForestTimerPage /></RequireAuth>} />
                        <Route path="/tests/:subjectSlug/:chapterSlug/:folderSlug/start" element={<RequireAuth><Tests /></RequireAuth>} />
                        <Route path="/tests/:subjectSlug/:chapterSlug/:folderSlug/:mode" element={<RequireAuth><Tests /></RequireAuth>} />
                        <Route path="/tests/:subjectSlug/:chapterSlug/:folderSlug/:mode/:questionSlug" element={<RequireAuth><Tests /></RequireAuth>} />
                        <Route path="/ai" element={<RequireAuth><AiChat /></RequireAuth>} />
                        <Route path="/ai/:chatId" element={<RequireAuth><AiChat /></RequireAuth>} />
                        <Route path="/ai-mentor" element={<RequireAuth><AiMentor /></RequireAuth>} />
                        <Route path="/courses/create" element={<RequireAuth><CourseCreator /></RequireAuth>} />
                        <Route path="/courses/edit/:id" element={<RequireAuth><CourseCreator /></RequireAuth>} />
                        <Route path="/courses/:category/:courseSlug/lessons/:lessonSlug" element={<RequireAuth><CourseLesson /></RequireAuth>} />
                        <Route path="/courses/:category/:courseSlug/test/:testId" element={<RequireAuth><CourseTest /></RequireAuth>} />
                        <Route path="/math-solver" element={<RequireAuth><MathSolver /></RequireAuth>} />
                        <Route path="/math-scans" element={<RequireAuth><MathSolver /></RequireAuth>} />
                        <Route path="/math-scan" element={<RequireAuth><MathSolver /></RequireAuth>} />
                        <Route path="/mock-tests/:id" element={<RequireAuth><MockTestSession /></RequireAuth>} />
                        <Route path="/mock-tests/:id/info" element={<RequireAuth><MockTestInfo /></RequireAuth>} />
                        <Route path="/mock-test/:id" element={<RequireAuth><MockTestSession /></RequireAuth>} />
                        <Route path="/mock-test/:id/info" element={<RequireAuth><MockTestInfo /></RequireAuth>} />
                        <Route path="/tests/builder" element={<RequireAuth><BuilderTest isAdmin={false} /></RequireAuth>} />
                        <Route path="/tests/contributor" element={<RequireAuth><ContributorPage /></RequireAuth>} />
                        <Route path="/tests/contributor/ai-generate" element={<RequireAuth><AIGenerateQuestionsWrapper /></RequireAuth>} />
                        <Route path="/tests/builder/:id/take" element={<RequireAuth><BuilderTestSession /></RequireAuth>} />
                        <Route path="/essay-checker" element={<RequireAuth><EssayChecker /></RequireAuth>} />
                        <Route path="/lugat" element={<RequireAuth><Vocabulary /></RequireAuth>} />
                        <Route path="/lugat/game" element={<RequireAuth><VocabRunnerPage /></RequireAuth>} />
                        <Route path="/taqdimot" element={<RequireAuth><Taqdimot /></RequireAuth>} />
                      </Route>

                      <Route element={<AppLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/results" element={<Results />} />
                        <Route path="/results/:tab" element={<Results />} />
                        <Route path="/results/:tab/:id" element={<Results />} />
                        <Route path="/olympiads" element={<Olympiads />} />
                        <Route path="/olympiads/:id" element={<OlympiadDetails />} />
                        <Route path="/olympiads/:id/:slug" element={<OlympiadDetails />} />
                        <Route path="/teachers" element={<UnderConstruction title="O'qituvchilar ruyxati" />} />
                        <Route path="/teachers/:teacherName" element={<Portfolio />} />
                        <Route path="/teachers/:teacherName/courses" element={<Portfolio />} />
                        <Route path="/question-bank" element={<UnderConstruction title="Savollar banki" />} />
                        <Route path="/question-bank/:subject" element={<UnderConstruction title="Savollar banki" />} />
                        <Route path="/support" element={<Support />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/wallet" element={<Navigate to="/settings/hamyon" replace />} />
                        <Route path="/profile" element={<Navigate to="/settings/profil" replace />} />
                        <Route path="/profile/:username" element={<Navigate to="/settings/profil" replace />} />
                        <Route path="/settings" element={<AccountSettings />} />
                        <Route path="/settings/:tab" element={<AccountSettings />} />
                        <Route path="/errors" element={<MyErrors />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/resources" element={<Resources />} />
                        <Route path="/planner" element={<Planner />} />
                      </Route>


                      <Route element={<AdminLayout />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/admin/analytics" element={<AdminAnalytics />} />
                        <Route path="/admin/announcements" element={<AdminAnnouncements />} />
                        <Route path="/admin/tests" element={<AdminTests />} />
                        <Route path="/admin/tests/create" element={<CreateTest />} />
                        <Route path="/admin/tests/edit/:id" element={<CreateTest />} />
                        <Route path="/admin/tests/builder" element={<BuilderTest />} />
                        <Route path="/admin/users" element={<AdminUsers />} />
                        <Route path="/admin/complaints" element={<AdminComplaints />} />
                        <Route path="/admin/feedback" element={<AdminFeedback />} />
                        <Route path="/admin/finance" element={<AdminFinance />} />
                        <Route path="/admin/mock-tests" element={<AdminMockTests />} />
                        <Route path="/admin/mock-tests/create" element={<CreateMockTest />} />
                        <Route path="/admin/mock-tests/edit/:id" element={<CreateMockTest />} />
                        <Route path="/admin/universities" element={<AdminUniversities />} />
                        <Route path="/admin/catalog" element={<AdminCatalog />} />
                        <Route path="/admin/blog" element={<AdminBlog />} />
                        <Route path="/admin/moderation" element={<AdminModeration />} />
                        <Route path="/admin/guide" element={<AdminGuide />} />
                        <Route path="/admin/settings" element={<AdminSettings />} />
                        <Route path="/admin/pdf-import" element={<PdfImport />} />
                      </Route>
                      <Route path="/olympiads/:id/exam" element={<OlympiadExam />} />
                      <Route path="/olympiads/:id/:slug/exam" element={<OlympiadExam />} />
                      <Route path="/universitetlar" element={<Universitetlar />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </EduCoinProvider>
                </SubjectProvider>
                </DeviceBlockGuard>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeCustomizerProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
