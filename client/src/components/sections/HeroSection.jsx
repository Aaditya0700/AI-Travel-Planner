import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className='hero-section' aria-labelledby='hero-title'>
      <div className='hero-background' aria-hidden='true'>
        <img
          src='https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&h=1080&fit=crop&auto=format&q=80'
          alt=''
          loading='eager'
        />
        <div className='hero-overlay' />
      </div>

      <div className='hero-content'>
        <div className='hero-inner'>
          <h1 id='hero-title' className='hero-headline'>
            Plan your journey.<br />
            <span className='gradient-text'>Explore the world with AI.</span>
          </h1>
          <p className='hero-subtext'>
            Create personalized itineraries, discover destinations, manage your travel budget,
            and get AI-powered travel assistance — all in one place.
          </p>

          <div className='hero-ctas'>
            <Link to='/register' className='btn btn-hero btn-primary'>
              <span className='material-symbols-outlined'>explore</span>
              Plan Your Trip
            </Link>
            <a href='#destinations' className='btn btn-hero btn-outline'>
              <span className='material-symbols-outlined'>map</span>
              Explore Destinations
            </a>
          </div>

          <div className='hero-search' role='search' aria-label='Destination search'>
            <div className='hero-search-inner'>
              <span className='material-symbols-outlined hero-search-icon'>search</span>
              <input
                type='text'
                placeholder='Where do you want to go?'
                readOnly
                aria-label='Destination search (navigate to explore section)'
                onClick={() => document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' })}
              />
              <span className='hero-search-hint'>Try "Jaipur", "Goa", "Kyoto"...</span>
            </div>
          </div>
        </div>
      </div>

      <div className='hero-scroll-indicator' aria-hidden='true'>
        <span className='material-symbols-outlined'>keyboard_arrow_down</span>
      </div>
    </section>
  );
}
