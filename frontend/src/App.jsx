import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Phase 1 Pages (Preserved)
import HomePage from './pages/HomePage';
import AllSchemesPage from './pages/AllSchemesPage';
import SchemeDetailsPage from './pages/SchemeDetailsPage';
import CategoriesPage from './pages/CategoriesPage';
import NotFoundPage from './pages/NotFoundPage';

// Phase 2 Pages (Auth, Profile, Eligibility & Bookmarks)
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import EligibilityPage from './pages/EligibilityPage';
import SavedSchemesPage from './pages/SavedSchemesPage';

// Phase 5: Smart Personalized Recommendations
import RecommendationsPage from './pages/RecommendationsPage';

// Phase 3 Pages (Application Tracker & Notifications)
import ApplicationsPage from './pages/ApplicationsPage';
import NotificationsPage from './pages/NotificationsPage';

// Phase 3 Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminSchemesPage from './pages/admin/AdminSchemesPage';
import AdminSchemeFormPage from './pages/admin/AdminSchemeFormPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminApplicationsPage from './pages/admin/AdminApplicationsPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';

import './App.css';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <ScrollToTop />
        {/* Navigation Header - Rendered on public and citizen pages */}
        {!isAdminRoute && <Navbar />}

        {/* Main Content Area */}
        <main className="flex-1">
          <Routes>
            {/* Phase 1 Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/schemes" element={<AllSchemesPage />} />
            <Route path="/schemes/:id" element={<SchemeDetailsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />

            {/* Phase 2 Public Routes */}
            <Route path="/eligibility" element={<EligibilityPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Phase 2 Protected Citizen Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recommendations"
              element={
                <ProtectedRoute>
                  <RecommendationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved-schemes"
              element={
                <ProtectedRoute>
                  <SavedSchemesPage />
                </ProtectedRoute>
              }
            />

            {/* Phase 3 Protected Citizen Routes */}
            <Route
              path="/applications"
              element={
                <ProtectedRoute>
                  <ApplicationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />

            {/* Phase 3 Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="schemes" element={<AdminSchemesPage />} />
              <Route path="schemes/new" element={<AdminSchemeFormPage />} />
              <Route path="schemes/:id/edit" element={<AdminSchemeFormPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="applications" element={<AdminApplicationsPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        {/* Footer - Rendered on public and citizen pages */}
        {!isAdminRoute && <Footer />}
      </div>
    </AuthProvider>
  );
}

export default App;
