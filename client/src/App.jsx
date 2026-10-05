import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import TripsPage from './pages/TripsPage.jsx';
import TripDetailPage from './pages/TripDetailPage.jsx';
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
      {/* Public pages. */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Everything below needs a logged in user. */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/*
          index marks this as the "/" route. A signed in visitor who opens the
          root goes straight to their trips. A signed out visitor never reaches
          this route, because ProtectedRoute sends them to /login first.
        */}
        <Route index element={<Navigate to="/trips" replace />} />
        <Route path="trips" element={<TripsPage />} />
        <Route path="trips/:id" element={<TripDetailPage />} />

        {/* Unknown URL inside the app, for example /trips/typo. */}
        <Route path="*" element={<Navigate to="/trips" replace />} />
      </Route>

      {/*
        A signed out visitor who opens an unknown URL should end up at login,
        not on a page that needs a session.
      */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
