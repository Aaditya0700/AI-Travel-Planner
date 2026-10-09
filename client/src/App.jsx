import { useLayoutEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import TripsPage from './pages/TripsPage.jsx';
import TripDetailPage from './pages/TripDetailPage.jsx';
import PhotoGuidePage from './pages/PhotoGuidePage.jsx';
import './App.css';

const REVEAL_SELECTOR = [
  '.landing-section',
  '.section-header',
  '.step-card',
  '.category-card',
  '.destination-card-link',
  '.attraction-card',
  '.food-card',
  '.itinerary-preview-card',
  '.feature-card',
  '.budget-summary-card',
  '.budget-breakdown-card',
  '.page-header',
  '.page > .card',
  '.trip-list > .trip-card',
  '.expense-list > .expense-item',
  '.analytics-card',
  '.itinerary-day-card',
  '.itinerary-activity-card',
  '.chatbot-card',
  '.photo-guide-card',
  '.auth-card',
  '.empty-state',
].join(',');

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
  const location = useLocation();

  useLayoutEffect(() => {
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    ) {
      return undefined;
    }

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-reveal-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

    function observeRevealTarget(element) {
      if (element.classList.contains('scroll-reveal-item')) return;

      element.classList.add('scroll-reveal-item');
      revealObserver.observe(element);
    }

    function scanRevealTargets(root) {
      if (root.nodeType === Node.ELEMENT_NODE && root.matches(REVEAL_SELECTOR)) {
        observeRevealTarget(root);
      }

      root.querySelectorAll?.(REVEAL_SELECTOR).forEach(observeRevealTarget);
    }

    scanRevealTargets(document);
    document.documentElement.classList.add('motion-reveals-ready');

    const mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => {
        record.removedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          if (node.classList.contains('scroll-reveal-item')) {
            revealObserver.unobserve(node);
            node.classList.remove('scroll-reveal-item', 'scroll-reveal-visible');
          }

          node.querySelectorAll('.scroll-reveal-item').forEach((element) => {
            revealObserver.unobserve(element);
            element.classList.remove('scroll-reveal-item', 'scroll-reveal-visible');
          });
        });

        record.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) scanRevealTargets(node);
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      revealObserver.disconnect();
      document.documentElement.classList.remove('motion-reveals-ready');
      document.querySelectorAll('.scroll-reveal-item, .scroll-reveal-visible').forEach((element) => {
        element.classList.remove('scroll-reveal-item', 'scroll-reveal-visible');
      });
    };
  }, []);

  return (
    <div key={location.key} className="route-transition">
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
    </div>
  );
}
