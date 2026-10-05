import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';

// Wraps a page that needs a logged in user.
// While the stored token is being checked we show a loading state, otherwise a
// refresh would briefly bounce a logged in user to the login page.
export default function ProtectedRoute({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="page-loading" role="status">
        Loading your trips...
      </div>
    );
  }

  if (status === 'signed-out') {
    // Remember where they were going so login can send them back.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
