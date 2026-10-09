import { features, getFeatureIcon } from '../../data/features.js';


export default function FeaturesSection() {
  return (
    <section id='features' className='landing-section' aria-labelledby='features-title'>
      <div className='section-container'>
        <header className='section-header'>
          <h2 id='features-title' className='section-title'>AI Travel Planner</h2>
          <p className='section-subtext'>
            Everything you need to plan, book, and experience unforgettable journeys.
          </p>
        </header>

        <div className='card-grid card-grid-4'>
          {features.map((feature) => (
            <article
              key={feature.id}
              className='feature-card'
              data-feature={feature.id}
            >
              <div className='feature-icon'>
<span className='material-symbols-outlined' aria-hidden='true'>
                  {getFeatureIcon(feature.icon)}
                </span>
              </div>
              {feature.beta && (
                <span className='feature-badge'>Beta</span>
              )}
<h3 className='feature-title'>{feature.title}</h3>
              <p className='feature-desc'>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
