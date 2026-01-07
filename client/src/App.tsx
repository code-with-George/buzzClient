import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from '@/store/AppContext';
import { Login } from '@/components/Login';
import { MainApp } from '@/components/MainApp';

function AppRoutes() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('buzz-token');
    const userId = localStorage.getItem('buzz-user-id');
    
    if (token && userId) {
      dispatch({
        type: 'SET_AUTHENTICATED',
        payload: { isAuthenticated: true, userId },
      });
    }
  }, [dispatch]);

  // Redirect based on auth state
  useEffect(() => {
    if (state.isAuthenticated && window.location.pathname === '/') {
      navigate('/app');
    }
  }, [state.isAuthenticated, navigate]);

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/app/*"
        element={
          state.isAuthenticated ? (
            <MainApp />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}

