import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/trips" className="brand">
          <span className="brand-mark" aria-hidden="true">
            AI
          </span>
          <span>AI Travel Planner</span>
        </Link>

        <nav className="nav-links" aria-label="Main">
          <NavLink to="/trips" className={({ isActive }) => (isActive ? 'active' : '')}>
            Trips
          </NavLink>
        </nav>

        <div className="nav-user">
          {user && <span className="nav-email">{user.name}</span>}
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
