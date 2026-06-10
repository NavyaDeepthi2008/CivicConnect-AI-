import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import RaiseIssuePage from './pages/RaiseIssuePage';
import IssueDetailPage from './pages/IssueDetailPage';
import MapPage from './pages/MapPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import AnalyticsPage from './pages/AnalyticsPage';
import Layout from './components/shared/Layout';
import './index.css';

const PrivateRoute = ({ children }) => {
  const { token } = useApp();
  return token ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { token, user } = useApp();
  if (!token) return <Navigate to="/login" />;
  if (user && user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { token } = useApp();
  return !token ? children : <Navigate to="/dashboard" />;
};

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Layout><DashboardPage /></Layout></PrivateRoute>} />
        <Route path="/raise-issue" element={<PrivateRoute><Layout><RaiseIssuePage /></Layout></PrivateRoute>} />
        <Route path="/issues/:id" element={<PrivateRoute><Layout><IssueDetailPage /></Layout></PrivateRoute>} />
        <Route path="/map" element={<PrivateRoute><Layout><MapPage /></Layout></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Layout><ProfilePage /></Layout></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><Layout><AdminPage /></Layout></AdminRoute>} />
        <Route path="/analytics" element={<PrivateRoute><Layout><AnalyticsPage /></Layout></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
