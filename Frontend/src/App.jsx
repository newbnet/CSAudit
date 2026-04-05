import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Register from './pages/Register';
import PendingDashboard from './pages/PendingDashboard';
import AuditorDashboard from './pages/AuditorDashboard';
import EndUserDashboard from './pages/EndUserDashboard';
import UserManagement from './pages/UserManagement';
import OwnerDashboard from './pages/OwnerDashboard';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';

export function homeForRole(role) {
  if (role === 'owner') return '/owner';
  if (role === 'auditor') return '/auditor';
  if (role === 'pending') return '/pending';
  return '/dashboard';
}

function ProtectedRoute({ children, role, roles }) {
  const allowed = roles ?? (role ? [role] : null);
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (allowed && !allowed.includes(user.role)) return <Navigate to={homeForRole(user.role)} replace />;
  return children;
}

function PendingOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'pending') return <Navigate to={homeForRole(user.role)} replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route
        path="/pending"
        element={
          <PendingOnlyRoute>
            <PendingDashboard />
          </PendingOnlyRoute>
        }
      />
      <Route
        path="/owner"
        element={
          <ProtectedRoute role="owner">
            <OwnerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/users"
        element={
          <ProtectedRoute role="owner">
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auditor"
        element={
          <ProtectedRoute roles={['auditor', 'owner']}>
            <AuditorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auditor/users"
        element={
          <ProtectedRoute roles={['auditor', 'owner']}>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="end-user">
            <EndUserDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
