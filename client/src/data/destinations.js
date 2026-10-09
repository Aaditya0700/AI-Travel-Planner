// Popular destinations data with stable Unsplash image URLs
// Image format: https://images.unsplash.com/photo-{id}?w=600&h=400&fit=crop&auto=format&q=80

export const destinations = [
  {
    id: 'jaipur',
    name: 'Jaipur',
    country: 'India',
    imageId: '1599661046289-e31897846e41',
    shortDesc: 'The Pink City — majestic forts, vibrant bazaars, and royal heritage.',
    anchor: 'jaipur'
  },
  {
    id: 'goa',
    name: 'Goa',
    country: 'India',
    imageId: '1587922546307-776227941871',
    shortDesc: 'Sun-drenched beaches, Portuguese heritage, and legendary nightlife.',
    anchor: 'goa'
  },
{
    id: 'kashmir',
    name: 'Kashmir',
    country: 'India',
    imageId: '1631420105765-caf5ccd069bc',
    shortDesc: 'Paradise on Earth \u2014 snow-capped peaks, serene lakes, and houseboats.',
    anchor: 'kashmir'
  },
{
    id: 'kerala',
    name: 'Kerala',
    country: 'India',
    imageId: '1593693411515-c20261bcad6e',
    shortDesc: "God's Own Country \u2014 backwaters, Ayurveda, and lush tea plantations.",
    anchor: 'kerala'
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    country: 'India',
    imageId: '1570168007204-dfb528c6958f',
    shortDesc: 'The City of Dreams \u2014 Bollywood, colonial architecture, and street food.',
    anchor: 'mumbai'
  },
  {
    id: 'delhi',
    name: 'Delhi',
    country: 'India',
    imageId: '1587474260584-136574528ed5',
    shortDesc: "India's capital \u2014 Mughal monuments, bustling markets, and modern energy.",
    anchor: 'delhi'
  },
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    imageId: '1537996194471-e657df975ab4',
    shortDesc: 'Island of the Gods \u2014 temples, rice terraces, and spiritual culture.',
    anchor: 'bali'
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    country: 'Japan',
    imageId: '1493976040374-85c8e12f0c0e',
    shortDesc: 'Ancient capital \u2014 zen gardens, geisha districts, and thousand temples.',
    anchor: 'kyoto'
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    imageId: '1502602898657-3e91760cbb34',
    shortDesc: 'City of Light \u2014 iconic landmarks, world-class museums, and cafe culture.',
    anchor: 'paris'
  }
];

export function getDestinationImageUrl(imageId, options = {}) {
  const { width = 600, height = 400, quality = 80 } = options;
  return `https://images.unsplash.com/photo-${imageId}?w=${width}&h=${height}&fit=crop&auto=format&q=${quality}`;
}

export function getDestinationPlaceholder(name) {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'%3E%3Crect fill='%23e3e0ec' width='600' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='24' fill='%23999'%3E${name}%3C/text%3E%3C/svg%3E`;
}
