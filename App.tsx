/**
 * Main Application Component
 * 
 * This is the root component that handles:
 * - Provider hierarchy (Language, Theme, Auth)
 * - View state management (landing, auth, app)
 * - Code splitting with React.lazy
 * - Error boundary for graceful error handling
 * 
 * @module App
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { LanguageProvider } from './components/LanguageContext';
import { ThemeProvider, useTheme } from './components/ThemeContext';
import { AuthProvider, useAuth } from './components/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { SkeletonDashboard } from './components/Skeleton';
import InstallPrompt from './components/InstallPrompt';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { Course } from './types';
import { COURSES } from './constants';

// ============================================================================
// Lazy-loaded Components (Code Splitting)
// ============================================================================

// ============================================================================
// Lazy-loaded Components Map (For Preloading)
// ============================================================================

const ROUTE_IMPORTS = {
  // Student
  dashboard: () => import('./components/Dashboard'),
  player: () => import('./components/Player'),
  quiz: () => import('./components/Quiz'),
  community: () => import('./components/Community'),
  library: () => import('./components/Library'),
  settings: () => import('./components/Settings'),
  profile: () => import('./components/Profile'),
  'daily-tracking': () => import('./components/DailyTracking'),
  notifications: () => import('./components/Notifications'),
  favorites: () => import('./components/Favorites'),
  progress: () => import('./components/PersonalProgress'),
  search: () => import('./components/Search'),
  certificates: () => import('./components/StudentCertificates'),

  // Admin
  'admin-dashboard': () => import('./components/AdminDashboard'),
  'admin-students': () => import('./components/AdminStudents'),
  'admin-audio-courses': () => import('./components/AdminAudioCourses'),
  'admin-reports': () => import('./components/AdminReports'),
  'admin-content': () => import('./components/AdminContentManagement'),
  'admin-announcements': () => import('./components/AdminAnnouncements'),
  'admin-quizzes': () => import('./components/AdminQuizManagement'),
  'admin-activity-log': () => import('./components/AdminActivityLog'),
  'admin-certificates': () => import('./components/AdminCertificateManagement'),
  'admin-backup': () => import('./components/AdminBackupSettings'),

  // Auth
  landing: () => import('./components/LandingPage'),
  auth: () => import('./components/Auth'),
  registration: () => import('./components/RegistrationForm'),
  'email-verification': () => import('./components/EmailVerification'),
};

// Student Components
const Dashboard = lazy(ROUTE_IMPORTS.dashboard);
const Player = lazy(ROUTE_IMPORTS.player);
const Quiz = lazy(ROUTE_IMPORTS.quiz);
const Community = lazy(ROUTE_IMPORTS.community);
const Library = lazy(ROUTE_IMPORTS.library);
const Settings = lazy(ROUTE_IMPORTS.settings);
const Profile = lazy(ROUTE_IMPORTS.profile);
const DailyTracking = lazy(ROUTE_IMPORTS['daily-tracking']);
const Notifications = lazy(ROUTE_IMPORTS.notifications);
const Favorites = lazy(ROUTE_IMPORTS.favorites);
const PersonalProgress = lazy(ROUTE_IMPORTS.progress);
const Search = lazy(ROUTE_IMPORTS.search);
const StudentCertificates = lazy(ROUTE_IMPORTS.certificates);

// Admin Components
const AdminDashboard = lazy(ROUTE_IMPORTS['admin-dashboard']);
const AdminStudents = lazy(ROUTE_IMPORTS['admin-students']);
const AdminAudioCourses = lazy(ROUTE_IMPORTS['admin-audio-courses']);
const AdminReports = lazy(ROUTE_IMPORTS['admin-reports']);
const AdminContentManagement = lazy(ROUTE_IMPORTS['admin-content']);
const AdminAnnouncements = lazy(ROUTE_IMPORTS['admin-announcements']);
const AdminQuizManagement = lazy(ROUTE_IMPORTS['admin-quizzes']);
const AdminActivityLog = lazy(ROUTE_IMPORTS['admin-activity-log']);
const AdminCertificateManagement = lazy(ROUTE_IMPORTS['admin-certificates']);
const AdminBackupSettings = lazy(ROUTE_IMPORTS['admin-backup']);

// Auth Components
const LandingPage = lazy(ROUTE_IMPORTS.landing);
const Auth = lazy(ROUTE_IMPORTS.auth);
const RegistrationForm = lazy(ROUTE_IMPORTS.registration);
const EmailVerification = lazy(ROUTE_IMPORTS['email-verification']);

// ============================================================================
// Types
// ============================================================================

type ViewState = 'landing' | 'auth' | 'app' | 'registration' | 'verification';
type AuthType = 'login' | 'signup';

// ============================================================================
// App Content Component
// ============================================================================

/**
 * Main content component that uses auth context
 * Separated from App to use hooks inside provider
 */
const AppContent: React.FC = () => {
  // App Content Component logic
  const { user, isAuthenticated, isLoading, logout, login, checkSession, setUser } = useAuth();
  const { isDark } = useTheme();
  const [viewState, setViewState] = useState<ViewState>('landing');
  const [authType, setAuthType] = useState<AuthType>('login');
  const [activeTab, setActiveTabOriginal] = useState('dashboard');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [previousTab, setPreviousTab] = useState<string>('dashboard');
  const [isPending, startTransition] = React.useTransition();
  const [pendingEmail, setPendingEmail] = useState<string>('');

  // Optimized tab switcher to prevent flickering
  const setActiveTab = React.useCallback((tab: string | ((prev: string) => string)) => {
    startTransition(() => {
      // Handle both function update and direct value
      if (typeof tab === 'function') {
        setActiveTabOriginal(prev => tab(prev));
      } else {
        setActiveTabOriginal(tab);
      }
    });
  }, []);

  // Sync view state with authentication state
  useEffect(() => {
    if (isAuthenticated) {
      setViewState('app');
    } else if (viewState === 'app') {
      setViewState('landing');
    }
  }, [isAuthenticated, viewState]);

  // Check for pending verification on mount
  useEffect(() => {
    const pendingVerificationEmail = localStorage.getItem('pendingVerificationEmail');
    if (pendingVerificationEmail && !isAuthenticated) {
      setPendingEmail(pendingVerificationEmail);
      setViewState('verification');
    }
  }, [isAuthenticated]);

  // Preload route code on hover - MUST be before any conditional returns
  const preloadRoute = React.useCallback((tabId: string) => {
    const role = user?.role || 'student';
    let importFn;

    // Map tab IDs to route imports based on role
    if (role === 'admin') {
      const adminMap: Record<string, () => Promise<any>> = {
        'dashboard': ROUTE_IMPORTS['admin-dashboard'],
        'students': ROUTE_IMPORTS['admin-students'],
        'audio-courses': ROUTE_IMPORTS['admin-audio-courses'],
        'reports': ROUTE_IMPORTS['admin-reports'],
        'content': ROUTE_IMPORTS['admin-content'],
        'announcements': ROUTE_IMPORTS['admin-announcements'],
        'quizzes': ROUTE_IMPORTS['admin-quizzes'],
        'activity-log': ROUTE_IMPORTS['admin-activity-log'],
        'certificates-admin': ROUTE_IMPORTS['admin-certificates'],
        'backup': ROUTE_IMPORTS['admin-backup'],
        'settings': ROUTE_IMPORTS.settings
      };
      importFn = adminMap[tabId];
    } else {
      const studentMap: Record<string, () => Promise<any>> = {
        'dashboard': ROUTE_IMPORTS.dashboard,
        'community': ROUTE_IMPORTS.community,
        'library': ROUTE_IMPORTS.library,
        'settings': ROUTE_IMPORTS.settings,
        'courses': () => Promise.resolve(),
        'certificates': ROUTE_IMPORTS.certificates,
        'quiz': ROUTE_IMPORTS.quiz,
        'profile': ROUTE_IMPORTS.profile,
        'daily-tracking': ROUTE_IMPORTS["daily-tracking"],
        'notifications': ROUTE_IMPORTS.notifications,
        'favorites': ROUTE_IMPORTS.favorites,
        'progress': ROUTE_IMPORTS.progress,
        'search': ROUTE_IMPORTS.search
      };
      importFn = studentMap[tabId];
    }

    if (importFn) {
      importFn();
    }
  }, [user]);

  /**
   * Handles playing a course - navigates to player view
   */
  const handlePlayCourse = (course: Course): void => {
    setPreviousTab(activeTab); // Remember where we came from
    setActiveCourse(course);
    setActiveTab('player');
  };

  /**
   * Handles returning to previous tab from player
   */
  const handleBackToDashboard = (): void => {
    startTransition(() => {
      setActiveCourse(null);
      setActiveTab(previousTab);
    });
  };

  /**
   * Handles user logout
   */
  const handleLogout = (): void => {
    startTransition(() => {
      logout();
      setViewState('landing');
      setActiveTab('dashboard');
      setActiveCourse(null);
    });
  };

  /**
   * Renders admin-specific content based on active tab
   */
  const renderAdminContent = (): React.ReactNode => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard setActiveTab={setActiveTab} />;
      case 'students':
        return <AdminStudents />;
      case 'audio-courses':
        return <AdminAudioCourses onPreview={(course) => {
          setPreviousTab('audio-courses');
          setActiveCourse(course);
          setActiveTab('player');
        }} />;
      case 'reports':
        return <AdminReports />;
      case 'content':
        return <AdminContentManagement />;
      case 'announcements':
        return <AdminAnnouncements />;
      case 'quizzes':
        return <AdminQuizManagement />;
      case 'activity-log':
        return <AdminActivityLog />;
      case 'certificates-admin':
        return <AdminCertificateManagement />;
      case 'backup':
        return <AdminBackupSettings />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <div className="flex items-center justify-center h-64 text-gray-400">
            Admin Page: {activeTab} (Coming Soon)
          </div>
        );
    }
  };

  /**
   * Renders student-specific content based on active tab
   */
  const renderStudentContent = (): React.ReactNode => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onPlayCourse={handlePlayCourse} setActiveTab={setActiveTab} />;
      case 'community':
        return <Community />;
      case 'library':
        return <Library />;
      case 'settings':
        return <Settings />;
      case 'courses':
        return <CoursesGrid onPlayCourse={handlePlayCourse} />;
      case 'certificates':
        return <StudentCertificates />;
      case 'quiz':
        return <Quiz />;
      case 'profile':
        return <Profile />;
      case 'daily-tracking':
        return <DailyTracking />;
      case 'notifications':
        return <Notifications />;
      case 'favorites':
        return <Favorites />;
      case 'progress':
        return <PersonalProgress />;
      case 'search':
        return <Search />;
      default:
        return (
          <div className="flex items-center justify-center h-64 text-gray-400">
            قريباً...
          </div>
        );
    }
  };

  /**
   * Main content renderer - handles player and role-based routing
   */
  const renderContent = (): React.ReactNode => {
    // Player view (both roles)
    if (activeTab === 'player' && activeCourse) {
      return <Player course={activeCourse} onBack={handleBackToDashboard} />;
    }

    const role = user?.role || 'student';
    return role === 'admin' ? renderAdminContent() : renderStudentContent();
  };

  // ========================================================================
  // Loading State
  // ========================================================================
  if (isLoading) {
    return <LoadingSpinner fullScreen message="جاري التحميل..." />;
  }

  // ========================================================================
  // Landing Page View
  // ========================================================================
  if (viewState === 'landing') {
    return (
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <LandingPage
          onLoginClick={() => {
            setAuthType('login');
            setViewState('auth');
          }}
          onSignupClick={() => {
            setViewState('registration');
          }}
          onQuickLogin={async (role) => {
            // Quick login with correct credentials
            const email = role === 'admin' ? 'admin@example.com' : 'ahmed@example.com';
            const password = role === 'admin' ? 'admin123' : '123456';
            try {
              const success = await login(email, password);
              if (success) {
                setViewState('app');
                setActiveTab('dashboard');
              } else {
                alert(`فشل تسجيل الدخول السريع. جرب الدخول يدوياً.`);
              }
            } catch (e) {
              console.error('Quick login error:', e);
              alert(`فشل تسجيل الدخول السريع.`);
            }
          }}
        />
        <InstallPrompt />
      </Suspense>
    );
  }

  // ========================================================================
  // Auth View
  // ========================================================================
  if (viewState === 'auth') {
    return (
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Auth
          initialView={authType}
          onToggleView={setAuthType}
          onBack={() => setViewState('landing')}
          onLoginSuccess={() => {
            setViewState('app');
            setActiveTab('dashboard');
          }}
          onVerificationRequired={(email) => {
            setPendingEmail(email);
            setViewState('verification');
          }}
        />
      </Suspense>
    );
  }

  // ========================================================================
  // Registration View
  // ========================================================================
  if (viewState === 'registration') {
    return (
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <RegistrationForm
          onBack={() => setViewState('landing')}
          onSuccess={(email) => {
            setPendingEmail(email);
            setViewState('verification');
          }}
        />
      </Suspense>
    );
  }

  // ========================================================================
  // Email Verification View
  // ========================================================================
  if (viewState === 'verification') {
    return (
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <EmailVerification
          email={pendingEmail}
          onSuccess={() => {
            localStorage.removeItem('pendingVerificationEmail');
            checkSession().then(() => {
              setViewState('app');
              setActiveTab('dashboard');
            });
          }}
          onBack={() => {
            localStorage.removeItem('pendingVerificationEmail');
            localStorage.removeItem('authToken');
            setPendingEmail('');
            setViewState('registration');
          }}
        />
      </Suspense>
    );
  }

  // ========================================================================
  // Main App View
  // ========================================================================
  // Dynamic theme classes
  const themeClasses = isDark
    ? 'bg-[url("https://github.com/NinjaWorld1234/Files/blob/main/Dark.png?raw=true")] bg-cover bg-center bg-fixed'
    : 'bg-[url("https://github.com/NinjaWorld1234/Files/blob/main/muslim_youth_forum_landing_page.png?raw=true")] bg-cover bg-center bg-fixed';

  return (
    <div className={`flex h-screen relative overflow-hidden ${themeClasses}`}>
      {/* Global Giant Ornaments */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] giant-symbol-star animate-spin-slow opacity-10 pointer-events-none z-0 translate-x-1/3 -translate-y-1/3" />
      <div className="fixed bottom-0 left-0 giant-symbol-arch opacity-10 pointer-events-none z-0 -translate-x-1/3 translate-y-1/3" />

      {/* Overlay Pattern */}
      <div className="fixed inset-0 mashrabiya-pattern opacity-5 pointer-events-none z-0" />

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onPreload={preloadRoute}
        onLogout={handleLogout}
        role={user?.role || 'student'}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header Gradient */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-0" />

        <Header setActiveTab={setActiveTab} />

        <div
          id="main-content"
          className="flex-1 overflow-y-auto overflow-x-hidden p-8 pt-0 custom-scrollbar relative z-10"
          role="main"
          aria-label="المحتوى الرئيسي"
        >
          <RouteErrorBoundary>
            <Suspense fallback={<SkeletonDashboard />}>
              {renderContent()}
            </Suspense>
          </RouteErrorBoundary>
        </div>
      </main>
    </div>
  );
};

// ============================================================================
// Courses Grid Component (Extracted for cleaner code)
// ============================================================================

interface CoursesGridProps {
  onPlayCourse: (course: Course) => void;
}

/**
 * Grid display of all available courses
 */
/**
 * Grid display of all available courses
 */
const CoursesGrid: React.FC<CoursesGridProps> = React.memo(({ onPlayCourse }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        // Dynamic import to avoid circular dependency if api depends on types which is fine, 
        // but let's import api directly at top if possible, or here.
        // Since api is already imported in many places, we should check imports. 
        // App.tsx doesn't import api yet. We need to add it.
        const { api } = await import('./services/api');
        const data = await api.getCourses();
        setCourses(data);
      } catch (error) {
        console.error("Failed to load courses", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCourses();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="animate-fade-in relative z-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">دوراتي</h2>
          <p className="text-gray-200">تابع تقدمك التعليمي</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div
            key={course.id}
            onClick={() => onPlayCourse(course)}
            className="glass-panel p-0 rounded-2xl overflow-hidden cursor-pointer group hover:border-emerald-500/50 transition-all bg-white/5 hover:bg-white/10"
          >
            <div className="h-48 relative">
              <img
                src={course.thumbnail}
                className="w-full h-full object-cover"
                alt={course.title}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="px-4 py-2 bg-emerald-600 rounded-lg text-sm font-bold">
                  ابدأ التعلم
                </span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg text-white mb-1">{course.title}</h3>
              <p className="text-sm text-gray-300 mb-4">{course.instructor}</p>
              <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
                <span>{course.duration}</span>
                <span>{course.category}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

CoursesGrid.displayName = 'CoursesGrid';

// ============================================================================
// Main App Component
// ============================================================================

/**
 * Root App component with all providers
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default App;