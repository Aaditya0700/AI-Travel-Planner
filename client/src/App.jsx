import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import TripsPage from './pages/TripsPage.jsx';
import TripDetailPage from './pages/TripDetailPage.jsx';
import PhotoGuidePage from './pages/PhotoGuidePage.jsx';
import './App.css';

// The shared frame for every page that needs a logged in user.
// It has no path of its own, so it is only a wrapper: the real URLs are
// declared as the children below, and <Outlet /> renders whichever one matched.
function AppLayout() {
  return (
    <div className="app-shell">
      <NavBar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public landing page - accessible to ALL users (authenticated & unauthenticated) */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected app routes - require authentication */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="trips" element={<TripsPage />} />
        <Route path="trips/:id" element={<TripDetailPage />} />
        <Route path="photo-guide" element={<PhotoGuidePage />} />

        {/* Unknown URL inside the app, for example /trips/typo. */}
        <Route path="*" element={<Navigate to="/trips" replace />} />
      </Route>

      {/* Catch-all for unknown public routes - redirect to landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
