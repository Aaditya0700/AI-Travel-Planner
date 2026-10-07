import { Link } from 'react-router-dom';
import { destinations, getDestinationImageUrl, getDestinationPlaceholder } from '../../data/destinations.js';

export default function DestinationsSection() {
  return (
    <section id='destinations' className='landing-section' aria-labelledby='destinations-title'>
      <div className='section-container'>
        <header className='section-header'>
          <h2 id='destinations-title' className='section-title'>Popular Destinations</h2>
          <p className='section-subtext'>
            Discover handpicked destinations loved by travelers worldwide.
          </p>
        </header>

        <div className='card-grid card-grid-3'>
          {destinations.map((dest) => (
            <Link
              key={dest.id}
              to={`/trips?destination=${dest.id}`}
              className='destination-card-link'
              aria-label={`Plan a trip to ${dest.name}`}
            >
              <article className='destination-card' data-destination={dest.id}>
                <div className='destination-card-image'>
                  <img
                    src={getDestinationImageUrl(dest.imageId, { width: 600, height: 400 })}
                    alt={`${dest.name}, ${dest.country}`}
                    loading='lazy'
                    onError={(e) => { e.currentTarget.src = getDestinationPlaceholder(dest.name); }}
                  />
                </div>
                <div className='destination-card-content'>
                  <div className='destination-card-meta'>
                    <span className='destination-country'>{dest.country}</span>
                  </div>
                  <h3 className='destination-name'>{dest.name}</h3>
                  <p className='destination-desc'>{dest.shortDesc}</p>
                  <span className='destination-link'>
                    Explore <span className='material-symbols-outlined'>arrow_forward</span>
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
