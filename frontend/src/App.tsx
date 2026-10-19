import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/Toast';
import { AppSidebar } from './components/layout/AppSidebar';
import { TopBar } from './components/layout/TopBar';
import { PublicNavbar } from './components/layout/PublicNavbar';
import { PublicFooter } from './components/layout/PublicFooter';

// Public pages
import { LandingPage } from './pages/public/LandingPage';
import { AboutPage } from './pages/public/AboutPage';
import { ContactPage } from './pages/public/ContactPage';
import { PortalAccessPage, PortalKind } from './pages/public/PortalAccessPage';

// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// Dashboard pages
import { OverviewPage } from './pages/dashboard/OverviewPage';
import { AppointmentsPage } from './pages/dashboard/AppointmentsPage';
import { QueuePage } from './pages/dashboard/QueuePage';
import { CheckInPage } from './pages/dashboard/CheckInPage';
import { PatientsPage } from './pages/dashboard/PatientsPage';
import { DoctorsPage } from './pages/dashboard/DoctorsPage';
import { PaymentsPage } from './pages/dashboard/PaymentsPage';
import { ReportsPage } from './pages/dashboard/ReportsPage';
import { NotificationsPage } from './pages/dashboard/NotificationsPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';

// Role portals
import { DoctorOverviewPage } from './pages/doctor/DoctorOverviewPage';
import { DoctorQueuePage } from './pages/doctor/DoctorQueuePage';
import { DoctorSchedulePage } from './pages/doctor/DoctorSchedulePage';
import { DoctorPatientsPage } from './pages/doctor/DoctorPatientsPage';
import { PatientPortalPage } from './pages/patient/PatientPortalPage';
import { PatientQueuePage } from './pages/patient/PatientQueuePage';
import { PatientAppointmentsPage } from './pages/patient/PatientAppointmentsPage';
import { PatientPaymentsPage } from './pages/patient/PatientPaymentsPage';

import { useActiveRole, useAuth, useClinicData } from './lib/hooks/useClinic';
import { Role } from './types';
import { ThemeProvider } from './lib/theme';
import { authService } from './lib/services/authService';
import { Button } from './components/ui/Button';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60
    }
  }
});

function MainRouter() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      return p && p !== '' ? p : '/';
    }
    return '/';
  });

  const [locationKey, setLocationKey] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const role = useActiveRole();
  const { user, isLoading: isAuthLoading, error: authError } = useAuth();

  const homeForRole = (activeRole: Role) =>
    activeRole === 'doctor'
      ? '/doctor/overview'
      : activeRole === 'patient'
        ? '/patient/dashboard'
        : '/dashboard/overview';

  // Keep state synced with browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
      setLocationKey(k => k + 1);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    // If hash link on same page
    if (path.startsWith('/#')) {
      const id = path.slice(2);
      if (currentPath !== '/') {
        window.history.pushState({}, '', '/');
        setCurrentPath('/');
        setLocationKey(k => k + 1);
      }
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return;
    }

    const target = new URL(path, window.location.origin);
    const targetPath = target.pathname || '/';
    const targetUrl = `${targetPath}${target.search}${target.hash}`;
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== targetUrl) {
      window.history.pushState({}, '', targetUrl);
    }
    setCurrentPath(targetPath);
    setLocationKey(k => k + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAuthLoading) return;
    const isProtectedPath = currentPath.startsWith('/dashboard') ||
      currentPath.startsWith('/doctor') ||
      currentPath.startsWith('/patient');
    if (isProtectedPath && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      const actualRole = user.role.toLowerCase() as Role;
      const allowed =
        actualRole === 'admin' || actualRole === 'receptionist'
          ? currentPath.startsWith('/dashboard')
          : actualRole === 'doctor'
            ? currentPath.startsWith('/doctor')
            : currentPath.startsWith('/patient');
      if (isProtectedPath && !allowed) navigate(homeForRole(actualRole));
    }
  }, [currentPath, isAuthLoading, user]);

  if (isAuthLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#09090b]">
        <p className="text-sm text-slate-500 dark:text-zinc-400">Restoring your secure session…</p>
      </main>
    );
  }

  if (authError) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#09090b] p-6">
        <div role="alert" className="max-w-md rounded-xl border border-red-200 bg-white p-5 text-sm text-red-700 shadow-sm">
          Unable to verify the current session: {authError.message}
          <Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </main>
    );
  }

  const portalMatch = currentPath.match(/^\/portals\/(patient|doctor|admin)$/);
  const isPublicRoute =
    currentPath === '/' ||
    currentPath === '/about' ||
    currentPath === '/contact' ||
    Boolean(portalMatch);

  const isAuthRoute =
    currentPath === '/login' ||
    currentPath === '/register' ||
    currentPath === '/forgot-password';

  // Handle page rendering
  const renderPageContent = () => {
    // Public routes
    if (currentPath === '/') return <LandingPage onNavigate={navigate} />;
    if (currentPath === '/about') return <AboutPage onNavigate={navigate} />;
    if (currentPath === '/contact') return <ContactPage onNavigate={navigate} />;
    if (portalMatch) {
      return <PortalAccessPage portal={portalMatch[1] as PortalKind} onNavigate={navigate} />;
    }

    // Auth routes
    if (currentPath === '/login') return <LoginPage onNavigate={navigate} />;
    if (currentPath === '/register') return <RegisterPage onNavigate={navigate} />;
    if (currentPath === '/forgot-password') return <ForgotPasswordPage onNavigate={navigate} />;

    // Doctor specific routes
    if (currentPath.startsWith('/doctor')) {
      if (currentPath === '/doctor/appointments') return <DoctorSchedulePage onNavigate={navigate} />;
      if (currentPath === '/doctor/queue') return <DoctorQueuePage onNavigate={navigate} />;
      if (currentPath === '/doctor/patients') return <DoctorPatientsPage onNavigate={navigate} />;
      if (currentPath === '/doctor/notifications') return <NotificationsPage onNavigate={navigate} />;
      return <DoctorOverviewPage onNavigate={navigate} />;
    }

    // Patient specific routes
    if (currentPath.startsWith('/patient')) {
      if (currentPath === '/patient/queue') return <PatientQueuePage onNavigate={navigate} />;
      if (currentPath === '/patient/appointments') return <PatientAppointmentsPage onNavigate={navigate} />;
      if (currentPath === '/patient/payments') return <PatientPaymentsPage onNavigate={navigate} />;
      if (currentPath === '/patient/notifications') return <NotificationsPage onNavigate={navigate} />;
      return <PatientPortalPage onNavigate={navigate} />;
    }

    // Admin & Receptionist Dashboard routes
    switch (currentPath) {
      case '/dashboard/appointments':
        return <AppointmentsPage onNavigate={navigate} />;
      case '/dashboard/queue':
        return <QueuePage onNavigate={navigate} />;
      case '/dashboard/check-in':
        return <CheckInPage onNavigate={navigate} />;
      case '/dashboard/patients':
        return <PatientsPage onNavigate={navigate} />;
      case '/dashboard/doctors':
        return <DoctorsPage onNavigate={navigate} />;
      case '/dashboard/payments':
        return <PaymentsPage onNavigate={navigate} />;
      case '/dashboard/reports':
        return <ReportsPage onNavigate={navigate} />;
      case '/dashboard/notifications':
        return <NotificationsPage onNavigate={navigate} />;
      case '/dashboard/settings':
        return <SettingsPage onNavigate={navigate} />;
      case '/dashboard/overview':
      default:
        return <OverviewPage onNavigate={navigate} role={role} />;
    }
  };

  // If public route, render with public navbar & footer
  if (isPublicRoute) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 transition-colors">
        <PublicNavbar currentPath={currentPath} onNavigate={navigate} />
        <main className="flex-1">
          <div key={`${currentPath}-${locationKey}`} className="animate-in fade-in duration-300 slide-in-from-bottom-2 ease-out">
            {renderPageContent()}
          </div>
        </main>
        <PublicFooter onNavigate={navigate} />
      </div>
    );
  }

  // If auth route, render full-bleed
  if (isAuthRoute) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 transition-colors">
        <div key={`${currentPath}-${locationKey}`} className="animate-in fade-in duration-300 slide-in-from-bottom-2 ease-out">
          {renderPageContent()}
        </div>
      </main>
    );
  }

  if (!user) return null;

  const actualRole = user.role.toLowerCase() as Role;
  const canOpenAdminPortal = actualRole === 'admin' || actualRole === 'receptionist';
  const portalLabel = actualRole === 'patient'
    ? 'Patient Portal'
    : actualRole === 'doctor'
      ? 'Doctor Portal'
      : actualRole === 'receptionist'
        ? 'Reception Workspace'
        : 'Admin Portal';
  if (
    (currentPath.startsWith('/dashboard') && !canOpenAdminPortal) ||
    (currentPath.startsWith('/doctor') && actualRole !== 'doctor') ||
    (currentPath.startsWith('/patient') && actualRole !== 'patient')
  ) {
    return null;
  }

  // Otherwise, render full SaaS Dashboard Layout
  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 transition-colors">
      {/* Sidebar */}
      <AppSidebar
        currentPath={currentPath}
        onNavigate={navigate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        role={role}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          role={actualRole}
          userName={`${user.firstName} ${user.lastName}`}
          onLogout={async () => {
            await authService.logout();
            queryClient.clear();
            navigate('/login');
          }}
          onNavigate={navigate}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-zinc-400">
            <span className={`h-2 w-2 rounded-full ${
              actualRole === 'patient'
                ? 'bg-violet-500'
                : actualRole === 'doctor'
                  ? 'bg-emerald-500'
                  : 'bg-blue-600'
            }`} />
            {portalLabel}
          </div>
          <DashboardDataStatus />
          <div key={currentPath} className="animate-in fade-in duration-300 slide-in-from-bottom-2 ease-out">
            {renderPageContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardDataStatus() {
  const { isLoading, errors, refetch } = useClinicData();
  if (!isLoading && errors.length === 0) return null;

  return (
    <div
      role={errors.length ? 'alert' : 'status'}
      className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
        errors.length
          ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200'
          : 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200'
      }`}
    >
      {errors.length ? (
        <>
          <p className="font-semibold">Some clinic data could not be loaded.</p>
          <p className="mt-1">{errors.join(' · ')}</p>
          <button type="button" className="mt-2 font-semibold underline" onClick={() => void refetch()}>
            Retry
          </button>
        </>
      ) : (
        'Loading clinic data…'
      )}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <MainRouter />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
