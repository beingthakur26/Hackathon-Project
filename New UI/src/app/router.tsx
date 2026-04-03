import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../ui/layouts/MainLayout';
import LandingPage from '../pages/LandingPage';
import ToxicityPage from '../pages/ToxicityPage';
import ExplorePage from '../pages/ExplorePage';
import AgentPage from '../pages/AgentPage';
import DashboardPage from '../pages/DashboardPage';
import LabPage from '../pages/LabPage';
import BatchPage from '../pages/BatchPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';

// Simple Protected Route helper (optional, can be expanded)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('toxinai_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'check',
        element: <ToxicityPage />,
      },
      {
        path: 'toxicity',
        element: <ToxicityPage />,
      },
      {
        path: 'explore',
        element: <ExplorePage />,
      },
      {
        path: 'agent',
        element: <AgentPage />,
      },
      {
        path: 'lab',
        element: <LabPage />,
      },
      {
        path: 'batch',
        element: <BatchPage />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
