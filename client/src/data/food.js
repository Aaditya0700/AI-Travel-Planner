// Popular food and culinary experiences data with verified image URLs

export const foodExperiences = [
  {
    id: 'dal-baati-churma',
    name: 'Dal Baati Churma',
    destination: 'Jaipur',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Dal_Baati_Churma.jpg',
    shortDesc: 'Rajasthani signature — baked wheat balls with lentils and sweet crumble.',
    isMustTry: true
  },
  {
    id: 'goan-fish-curry',
    name: 'Goan Fish Curry',
    destination: 'Goa',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Goan_Fish_Curry.jpg',
    shortDesc: 'Tangy coconut-based curry with fresh catch — coastal flavor at its best.',
    isMustTry: true
  },
  {
    id: 'rogan-josh',
    name: 'Rogan Josh',
    destination: 'Kashmir',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Mutton_rogan_josh.jpg',
    shortDesc: 'Aromatic lamb curry slow-cooked with Kashmiri chilies and spices.',
    isMustTry: true
  },
  {
    id: 'appam-stew',
    name: 'Appam & Stew',
    destination: 'Kerala',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Appam_and_stew.jpg',
    shortDesc: 'Lacy rice pancakes with creamy vegetable or meat stew — breakfast classic.',
    isMustTry: true
  },
  {
    id: 'vada-pav',
    name: 'Vada Pav',
    destination: 'Mumbai',
    imageId: '1750767397012-3413ba4fdbc7',
    shortDesc: 'Mumbai\'s beloved street food — spicy potato fritter in a soft bun.',
    isMustTry: true
  },
  {
    id: 'chole-bhature',
    name: 'Chole Bhature',
    destination: 'Delhi',
    imageUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Chole_bhature.jpg',
    shortDesc: 'Spicy chickpea curry with fluffy fried bread — Punjabi comfort food.',
    isMustTry: true
  },
  {
    id: 'sushi',
    name: 'Sushi',
    destination: 'Kyoto',
    imageId: '1579871494447-9811cf80d66c',
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

export function getFoodImageUrlFromUrl(imageUrl, options = {}) {
  const { width = 500 } = options;
  if (imageUrl.includes('commons.wikimedia.org') && !imageUrl.includes('width=')) {
    return `${imageUrl}?width=${width}`;
  }
  return imageUrl;
}

export function getFoodPlaceholder(name) {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 500'%3E%3Crect fill='%23e3e0ec' width='500' height='500'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='24' fill='%23999'%3E${name}%3C/text%3E%3C/svg%3E`;
}
