// Explore by category data with stable Unsplash image URLs

export const categories = [
  {
    id: 'mountains',
    label: 'Mountains',
    imageId: '1464822759023-fed622ff2c3b',
    icon: 'landscape'
  },
  {
    id: 'beaches',
    label: 'Beaches',
    imageId: '1507525428034-b723cf961d3e',
    icon: 'waves'
  },
  {
    id: 'heritage',
    label: 'Heritage',
    imageId: '1582510003544-4d00b7f74220',
    icon: 'castle'
  },
  {
    id: 'food',
    label: 'Food',
    imageId: '1546069901-ba9599a7e63c',
    icon: 'restaurant'
  },
  {
    id: 'wildlife',
    label: 'Wildlife',
    imageId: '1474511320723-9a56873867b5',
    icon: 'pets'
  },
  {
    id: 'spiritual',
    label: 'Spiritual',
    imageId: '1544367567-0f2fcb009e0b',
    icon: 'self_improvement'
  },
  {
    id: 'adventure',
    label: 'Adventure',
    imageId: '1501555088652-021faa106b9b',
    icon: 'directions_bike'
  },
  {
    id: 'weekend-getaways',
    label: 'Weekend Getaways',
    imageId: '1470071459604-3b5ec3a7fe05',
    icon: 'weekend'
  }
];

export function getCategoryImageUrl(imageId, options = {}) {
  const { width = 500, height = 400, quality = 80 } = options;
  return `https://images.unsplash.com/photo-${imageId}?w=${width}&h=${height}&fit=crop&auto=format&q=${quality}`;
}

export function getCategoryPlaceholder(label) {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 400'%3E%3Crect fill='%23e3e0ec' width='500' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='24' fill='%23999'%3E${label}%3C/text%3E%3C/svg%3E`;
}
