import { Link } from 'react-router-dom';

export default function CtaSection() {
  return (
    <section id='cta' className='landing-section cta-section' aria-labelledby='cta-title'>
      <div className='cta-background' aria-hidden='true'>
        <img
          src='https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&h=1080&fit=crop&auto=format&q=80'
          alt=''
        />
        <div className='cta-overlay' />
      </div>

      <div className='section-container'>
        <div className='cta-content'>
          <h2 id='cta-title' className='cta-title'>
            Your next adventure starts here.
          </h2>
          <p className='cta-subtext'>
            Plan smarter. Explore more. Travel better.
          </p>
          <Link to='/register' className='btn btn-hero btn-primary cta-btn'>
            <span className='material-symbols-outlined'>rocket_launch</span>
            Start Planning
          </Link>
        </div>
      </div>
    </section>
  );
}
