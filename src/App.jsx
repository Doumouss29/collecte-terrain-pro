import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Login from '@/pages/Login';
import AcceptInvitation from '@/pages/AcceptInvitation';

const DashboardSuperviseur = lazy(() => import('./pages/DashboardSuperviseur'));
const CollecteParCarte = lazy(() => import('./pages/CollecteParCarte'));
const ManuelUtilisation = lazy(() => import('./pages/ManuelUtilisation'));

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated, login } = useAuth();

  // Cette page doit rester publique car l'utilisateur invité
  // ne possède pas encore de compte ni de session.
  if (window.location.pathname === '/accept-invitation') {
    return <AcceptInvitation />;
  }

  if (isLoadingAuth) return <PageLoader />;
  if (!isAuthenticated) return <Login onSuccess={login} />;

  return (
    <Routes>
      <Route path="/" element={<LayoutWrapper currentPageName={mainPageKey}><MainPage /></LayoutWrapper>} />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route key={path} path={`/${path}`} element={<LayoutWrapper currentPageName={path}><Page /></LayoutWrapper>} />
      ))}
      <Route path="/DashboardSuperviseur" element={<Suspense fallback={<PageLoader />}><LayoutWrapper currentPageName="DashboardSuperviseur"><DashboardSuperviseur /></LayoutWrapper></Suspense>} />
      <Route path="/CollecteParCarte" element={<Suspense fallback={<PageLoader />}><CollecteParCarte /></Suspense>} />
      <Route path="/manuel-utilisation" element={<Suspense fallback={<PageLoader />}><ManuelUtilisation /></Suspense>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
