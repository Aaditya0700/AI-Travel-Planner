import { attractions, getAttractionImageUrl, getAttractionPlaceholder } from '../../data/attractions.js';

export default function AttractionsSection() {
  return (
    <section id='attractions' className='landing-section' aria-labelledby='attractions-title'>
      <div className='section-container'>
        <header className='section-header'>
          <h2 id='attractions-title' className='section-title'>Places Worth Visiting</h2>
          <p className='section-subtext'>
            Iconic landmarks and hidden gems that define each destination.
          </p>
        </header>

        <div className='attractions-carousel' role='list' aria-label='Attractions'>
          {attractions.map((attr) => (
            <article
              key={attr.id}
              className='attraction-card'
              role='listitem'
              data-attraction={attr.id}
            >
              <div className='attraction-card-image'>
                <img
                  src={getAttractionImageUrl(attr.imageId, { width: 500, height: 400 })}
                  alt={`${attr.name}, ${attr.destination}`}
                  loading='lazy'
                  onError={(e) => { e.currentTarget.src = getAttractionPlaceholder(attr.name); }}
                />
              </div>
              <div className='attraction-card-content'>
                <span className='attraction-category'>{attr.category}</span>
                <h3 className='attraction-name'>{attr.name}</h3>
                <p className='attraction-location'>
                  <span className='material-symbols-outlined'>location_on</span>
                  {attr.destination}
                </p>
                <p className='attraction-desc'>{attr.shortDesc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
