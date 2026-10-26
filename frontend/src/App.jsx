import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProductRegistrationPage from './pages/ProductRegistrationPage';
import ServiceCenterManagementPage from './pages/ServiceCenterManagementPage';
import ServiceCenterDashboardPage from './pages/ServiceCenterDashboardPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import ProductPassportPage from './pages/ProductPassportPage';
import TransferPage from './pages/TransferPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * ProtectedRoute component: verifies authentication and authorized role(s).
 * Redirects to /login if unauthenticated, and /unauthorized if role does not match.
 */
const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <LoadingSpinner message="Verifying authentication session..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

/**
 * PublicOnlyRoute component: redirects already logged in users away from login/register
 */
const PublicOnlyRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isAuthenticated && user) {
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'serviceCenter':
        return <Navigate to="/service-center" replace />;
      case 'owner':
      default:
        return <Navigate to="/owner" replace />;
    }
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/passport/:productId" element={<ProductPassportPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Guest Only Routes (Login/Register) */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      {/* Admin Only Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products/new"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ProductRegistrationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/service-centers"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ServiceCenterManagementPage />
          </ProtectedRoute>
        }
      />

      {/* Service Center Only Routes */}
      <Route
        path="/service-center"
        element={
          <ProtectedRoute allowedRoles={['serviceCenter']}>
            <ServiceCenterDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Owner Only Routes */}
      <Route
        path="/owner"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/transfer/:productId"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <TransferPage />
          </ProtectedRoute>
        }
      />

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
