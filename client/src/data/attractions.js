// Places worth visiting / attractions data with stable Unsplash image URLs

export const attractions = [
  {
    id: 'amber-fort',
    name: 'Amber Fort',
    destination: 'Jaipur',
    imageId: '1477587458883-47181e0ac48a',
    shortDesc: 'Magnificent hilltop fort with intricate marble work and mirror palace.',
    category: 'Heritage'
  },
  {
    id: 'gateway-india',
    name: 'Gateway of India',
    destination: 'Mumbai',
    imageId: '1570168007204-dfb528c6958f',
    shortDesc: 'Iconic arch monument overlooking the Arabian Sea, built in 1924.',
    category: 'Heritage'
  },
  {
    id: 'dal-lake',
    name: 'Dal Lake',
    destination: 'Kashmir',
    imageId: '1602216056096-3b40cc0c9944',
    shortDesc: 'Serene lake famous for houseboats, shikaras, and floating gardens.',
    category: 'Nature'
  },
{
    id: 'fort-kochi',
    name: 'Fort Kochi',
    destination: 'Kerala',
    imageId: '1645680149311-5a00ae5a2b2a',
    shortDesc: 'Historic coastal town with Chinese fishing nets and colonial architecture.',
    category: 'Heritage'
  },
  {
    id: 'baga-beach',
    name: 'Baga Beach',
    destination: 'Goa',
    imageId: '1512343879784-5420e6a6b7c2',
    shortDesc: 'Popular beach with water sports, shacks, and vibrant nightlife.',
    category: 'Beaches'
  },
  {
    id: 'eiffel-tower',
    name: 'Eiffel Tower',
    destination: 'Paris',
    imageId: '1502602898657-3e91760cbb34',
    shortDesc: 'Iconic iron lattice tower offering panoramic views of Paris.',
    category: 'Heritage'
  },
  {
    id: 'fushimi-inari',
    name: 'Fushimi Inari Shrine',
    destination: 'Kyoto',
    imageId: '1493976040374-85c8e12f0c0e',
    shortDesc: 'Famous for thousands of vermilion torii gates forming mountain trails.',
    category: 'Spiritual'
  },
{
    id: 'hawa-mahal',
    name: 'Hawa Mahal',
    destination: 'Jaipur',
    imageId: '1578999935853-4ec5fa6c1f60',
    shortDesc: 'Palace of Winds with 953 windows \u2014 stunning honeycomb facade.',
    category: 'Heritage'
  },
  {
    id: 'red-fort',
    name: 'Red Fort',
    destination: 'Delhi',
    imageId: '1587474260584-136574528ed5',
    shortDesc: 'UNESCO World Heritage Mughal fort — symbol of India\'s independence.',
    category: 'Heritage'
  },
{
    id: 'arashiyama-bamboo',
    name: 'Arashiyama Bamboo Grove',
    destination: 'Kyoto',
    imageId: '1684877217817-03df38f83895',
    shortDesc: 'Enchanting bamboo forest path \u2014 serene and photogenic.',
    category: 'Nature'
  }
];

export function getAttractionImageUrl(imageId, options = {}) {
  const { width = 500, height = 400, quality = 80 } = options;
  return `https://images.unsplash.com/photo-${imageId}?w=${width}&h=${height}&fit=crop&auto=format&q=${quality}`;
}

export function getAttractionPlaceholder(name) {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 400'%3E%3Crect fill='%23e3e0ec' width='500' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='24' fill='%23999'%3E${name}%3C/text%3E%3C/svg%3E`;
}
