import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { useState, useEffect, useRef } from 'react';

export default function NavBar() {
  const { user, logout, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  function handleProtectedNav(path) {
    if (status === 'signed-in') {
      navigate(path);
      setMobileMenuOpen(false);
    } else {
      navigate('/login', { replace: true, state: { from: path } });
    }
  }

const navLinks = [
    { label: 'Home', href: '/', public: true },
    { label: 'Itinerary', href: '/trips', public: false },
    { label: 'Photo Guide', href: '/photo-guide', public: false }
  ];

  const isActiveLink = (href) => {
    if (href.startsWith('#')) return false;
    return location.pathname === href || (href !== '/' && location.pathname.startsWith(href));
  };

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`} role="banner">
      <div className="navbar-inner">
        <Link to="/" className="brand" aria-label="AI Travel Planner - Home">
          <span className="brand-mark" aria-hidden="true">AI</span>
          <span className="brand-text">AI Travel Planner</span>
        </Link>

        <nav className="nav-desktop" aria-label="Main navigation">
          <ul className="nav-links">
            {navLinks.map((link) => (
              <li key={link.label}>
                {link.scroll ? (
                  <a
                    href={link.href}
                    className={`nav-link${isActiveLink(link.href) ? ' active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const target = document.querySelector(link.href);
                      target?.scrollIntoView({ behavior: 'smooth' });
                      setMobileMenuOpen(false);
                    }}
                  >
                    {link.label}
                  </a>
                ) : link.public ? (
                  <NavLink
                    to={link.href}
                    className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                ) : (
                  <a
                    href="#"
                    className={`nav-link${isActiveLink(link.href) ? ' active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleProtectedNav(link.href);
                    }}
                  >
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>

<div className="nav-actions">
          {status === 'loading' ? (
            <span className="nav-loading" aria-hidden="true" />
          ) : user ? (
            <div className="nav-user-dropdown" ref={userMenuRef}>
              <button
                type="button"
                className="nav-user-btn"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <span className="nav-user-avatar" aria-hidden="true">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
                <span className="nav-user-name">{user.name}</span>
                <span className="material-symbols-outlined nav-user-chevron">
                  {userMenuOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {userMenuOpen && (
                <div className="nav-user-dropdown-menu" role="menu">
                  <button
                    type="button"
                    className="nav-dropdown-item"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <span className="material-symbols-outlined">logout</span>
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost nav-btn" onClick={() => setMobileMenuOpen(false)}>
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary nav-btn" onClick={() => setMobileMenuOpen(false)}>
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="nav-hamburger"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      <div
        id="mobile-menu"
        className={`nav-mobile-drawer${mobileMenuOpen ? ' open' : ''}`}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="nav-mobile-overlay" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
        <div className="nav-mobile-panel">
          <div className="nav-mobile-header">
            <Link to="/" className="brand" onClick={() => setMobileMenuOpen(false)}>
              <span className="brand-mark" aria-hidden="true">AI</span>
              <span className="brand-text">AI Travel Planner</span>
            </Link>
          </div>
          <ul className="nav-mobile-links">
            {navLinks.map((link) => (
              <li key={link.label}>
                {link.scroll ? (
                  <a
                    href={link.href}
                    className="nav-mobile-link"
                    onClick={(e) => {
                      e.preventDefault();
                      const target = document.querySelector(link.href);
                      target?.scrollIntoView({ behavior: 'smooth' });
                      setMobileMenuOpen(false);
                    }}
                  >
                    {link.label}
                  </a>
                ) : link.public ? (
                  <NavLink
                    to={link.href}
                    className={({ isActive }) => `nav-mobile-link${isActive ? ' active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                ) : (
                  <a
                    href="#"
                    className="nav-mobile-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleProtectedNav(link.href);
                    }}
                  >
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
          <div className="nav-mobile-actions">
            {status === 'loading' ? (
              <div className="nav-loading" aria-hidden="true" />
            ) : user ? (
              <button
                type="button"
                className="btn btn-danger btn-block"
                onClick={handleLogout}
              >
                <span className="material-symbols-outlined">logout</span>
                Log out
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-block" onClick={() => setMobileMenuOpen(false)}>
                  Log in
                </Link>
                <Link to="/register" className="btn btn-primary btn-block" onClick={() => setMobileMenuOpen(false)}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
