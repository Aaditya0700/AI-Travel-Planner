const steps = [
  {
    number: '01',
    title: 'Choose Your Destination',
    description: 'Pick from popular destinations or search for your dream location.',
    icon: 'place'
  },
  {
    number: '02',
    title: 'Tell Us Your Preferences',
    description: 'Set dates, budget, travel style, and interests for a tailored plan.',
    icon: 'tune'
  },
  {
    number: '03',
    title: 'Get Your Personalized Itinerary',
    description: 'AI generates a day-by-day plan with activities, food, and logistics.',
    icon: 'event_note'
  },
  {
    number: '04',
    title: 'Travel, Track & Explore',
    description: 'Use the AI assistant, track expenses, and discover hidden gems on the go.',
    icon: 'explore'
  }
];

export default function HowItWorksSection() {
  return (
    <section id='how-it-works' className='landing-section landing-section--alt' aria-labelledby='how-title'>
      <div className='section-container'>
        <header className='section-header'>
          <h2 id='how-title' className='section-title'>How It Works</h2>
          <p className='section-subtext'>
            From dream to departure in four simple steps.
          </p>
        </header>

        <div className='steps-grid'>
          {steps.map((step, index) => (
            <article key={step.number} className='step-card'>
<div className='step-number'>{step.number}</div>
              <div className='step-icon'>
                <span className='material-symbols-outlined' aria-hidden='true'>{step.icon}</span>
              </div>
              <h3 className='step-title'>{step.title}</h3>
              <p className='step-desc'>{step.description}</p>
              {index < steps.length - 1 && (
                <div className='step-connector' aria-hidden='true' />
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
