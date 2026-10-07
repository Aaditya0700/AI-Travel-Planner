// Popular food and culinary experiences data with stable Unsplash image URLs

export const foodExperiences = [
  {
    id: 'dal-baati-churma',
    name: 'Dal Baati Churma',
    destination: 'Jaipur',
    imageId: '1546069901-ba9599a7e63c',
    shortDesc: 'Rajasthani signature — baked wheat balls with lentils and sweet crumble.',
    isMustTry: true
  },
{
    id: 'goan-fish-curry',
    name: 'Goan Fish Curry',
    destination: 'Goa',
    imageId: '1565299585323-38d6b0865b47',
    shortDesc: 'Tangy coconut-based curry with fresh catch — coastal flavor at its best.',
    isMustTry: true
  },
  {
    id: 'rogan-josh',
    name: 'Rogan Josh',
    destination: 'Kashmir',
    imageId: '1546069901-ba9599a7e63c',
    shortDesc: 'Aromatic lamb curry slow-cooked with Kashmiri chilies and spices.',
    isMustTry: true
  },
  {
    id: 'appam-stew',
    name: 'Appam & Stew',
    destination: 'Kerala',
    imageId: '1565299585323-38d6b0865b47',
    shortDesc: 'Lacy rice pancakes with creamy vegetable or meat stew — breakfast classic.',
    isMustTry: true
  },
  {
    id: 'vada-pav',
    name: 'Vada Pav',
    destination: 'Mumbai',
    imageId: '1565299585323-38d6b0865b47',
    shortDesc: 'Mumbai\'s beloved street food — spicy potato fritter in a soft bun.',
    isMustTry: true
  },
  {
    id: 'chole-bhature',
    name: 'Chole Bhature',
    destination: 'Delhi',
    imageId: '1565299585323-38d6b0865b47',
    shortDesc: 'Spicy chickpea curry with fluffy fried bread — Punjabi comfort food.',
    isMustTry: true
  },
  {
    id: 'sushi',
    name: 'Sushi',
    destination: 'Kyoto',
    imageId: '1579584425855-c9ce6a045d74',
    shortDesc: 'Artful vinegared rice with fresh fish — precision and tradition.',
    isMustTry: false
  },
  {
    id: 'croissants',
    name: 'Croissants',
    destination: 'Paris',
    imageId: '1555507036-ab1f4038808a',
    shortDesc: 'Buttery, flaky viennoiserie — the soul of a Parisian breakfast.',
    isMustTry: false
  }
];

export function getFoodImageUrl(imageId, options = {}) {
  const { width = 500, height = 500, quality = 80 } = options;
  return `https://images.unsplash.com/photo-${imageId}?w=${width}&h=${height}&fit=crop&auto=format&q=${quality}`;
}

export function getFoodPlaceholder(name) {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 500'%3E%3Crect fill='%23e3e0ec' width='500' height='500'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='24' fill='%23999'%3E${name}%3C/text%3E%3C/svg%3E`;
}
