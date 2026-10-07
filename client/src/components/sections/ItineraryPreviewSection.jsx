const mockItinerary = {
  destination: 'Jaipur, India',
  duration: '3 Days',
  days: [
    {
      day: 1,
      date: 'Day 1',
      theme: 'Arrival & Heritage',
      activities: [
        { time: 'Morning', title: 'Arrival & Hotel Check-in', desc: 'Settle into your heritage hotel near the City Palace', location: 'City Center' },
        { time: 'Afternoon', title: 'City Palace & Jantar Mantar', desc: 'Explore the royal residence and UNESCO astronomical observatory', location: 'City Palace Complex' },
        { time: 'Evening', title: 'Local Food Tour', desc: 'Taste authentic Dal Baati Churma at a traditional restaurant', location: 'Johari Bazaar' }
      ]
    },
    {
      day: 2,
      date: 'Day 2',
      theme: 'Forts & Culture',
      activities: [
        { time: 'Morning', title: 'Amber Fort & Elephant Ride', desc: 'Ascend the majestic hill fort with panoramic views', location: 'Amber, Jaipur' },
        { time: 'Afternoon', title: 'Hawa Mahal & Local Markets', desc: 'Photograph the Palace of Winds and shop for textiles', location: 'Hawa Mahal Road' },
        { time: 'Evening', title: 'Sunset at Nahargarh Fort', desc: 'Watch the city light up from the Tiger Fort', location: 'Nahargarh Fort' }
      ]
    }
  ]
};

export default function ItineraryPreviewSection() {
  return (
    <section id='itinerary-preview' className='landing-section' aria-labelledby='itinerary-preview-title'>
      <div className='section-container'>
        <header className='section-header'>
          <h2 id='itinerary-preview-title' className='section-title'>Your Itinerary, Visualized</h2>
          <p className='section-subtext'>
            See what an AI-generated travel plan looks like — detailed, personalized, and ready to go.
          </p>
        </header>

        <div className='itinerary-preview-card'>
          <div className='itinerary-preview-header'>
            <div className='itinerary-preview-meta'>
<span className='itinerary-destination'>{mockItinerary.destination}</span>
              <span className='itinerary-duration'>{mockItinerary.duration}</span>
            </div>
            <span className='material-symbols-outlined itinerary-preview-icon' aria-hidden='true'>map</span>
          </div>

          <div className='itinerary-preview-days'>
            {mockItinerary.days.map((day) => (
              <article key={day.day} className='itinerary-day'>
                <div className='itinerary-day-head'>
                  <div className='itinerary-day-label'>
<span className='itinerary-day-number'>{day.date}</span>
                    <span className='itinerary-day-theme'>{day.theme}</span>
                  </div>
                </div>
                <div className='itinerary-day-activities'>
                  {day.activities.map((activity, idx) => (
                    <div key={idx} className='itinerary-activity'>
<span className='itinerary-time'>{activity.time}</span>
                      <div className='itinerary-activity-info'>
                        <h4 className='itinerary-activity-title'>{activity.title}</h4>
                        <p className='itinerary-activity-desc'>{activity.desc}</p>
                        <span className='itinerary-activity-location'>
                          <span className='material-symbols-outlined'>location_on</span>
                          {activity.location}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className='itinerary-preview-footer'>
            <p className='itinerary-preview-note'>
              This is a preview. Your actual itinerary adapts to your preferences, pace, and budget.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
