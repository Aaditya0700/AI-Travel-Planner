import { Link } from 'react-router-dom';

const footerLinks = {
  product: [
    { label: 'Explore', href: '#explore' },
    { label: 'Destinations', href: '#destinations' },
    { label: 'Itinerary', href: '/trips' },
    { label: 'Budget', href: '/trips' },
    { label: 'AI Assistant', href: '/trips' },
    { label: 'Photo Guide', href: '/photo-guide' }
  ],
  company: [
    { label: 'About', href: '#' },
    { label: 'Contact', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Press', href: '#' }
  ],
  legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' }
  ],
  social: [
    { label: 'Twitter', href: '#', icon: 'twitter' },
    { label: 'Instagram', href: '#', icon: 'instagram' },
    { label: 'LinkedIn', href: '#', icon: 'linkedin' },
    { label: 'GitHub', href: '#', icon: 'code' }
  ]
};

export default function Footer() {
  return (
    <footer className='footer' role='contentinfo'>
      <div className='section-container'>
        <div className='footer-grid'>
          <div className='footer-brand'>
            <div className='footer-logo'>
              <span className='brand-mark' aria-hidden='true'>AI</span>
              <span>AI Travel Planner</span>
            </div>
            <p className='footer-tagline'>
              Plan your journey. Explore the world with AI.
            </p>
          </div>

          <nav className='footer-section' aria-label='Product'>
            <h4 className='footer-heading'>Product</h4>
            <ul>
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <nav className='footer-section' aria-label='Company'>
            <h4 className='footer-heading'>Company</h4>
            <ul>
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <nav className='footer-section' aria-label='Legal'>
            <h4 className='footer-heading'>Legal</h4>
            <ul>
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className='footer-bottom'>
          <div className='footer-social'>
            {footerLinks.social.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className='footer-social-link'
                aria-label={link.label}
              >
                <span className='material-symbols-outlined'>{link.icon}</span>
              </a>
            ))}
          </div>
          <p className='footer-copyright'>
            © AI Travel Planner. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
