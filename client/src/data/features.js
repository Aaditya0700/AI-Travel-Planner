// Core product features for the AI Travel Planner

export const features = [
  {
    id: 'ai-itinerary',
    title: 'AI Itinerary',
    description: 'Generate personalized day-by-day travel plans based on your destination, dates, budget, and preferences.',
    icon: 'map',
    beta: false
  },
  {
    id: 'smart-budget',
    title: 'Smart Budget',
    description: 'Track expenses, understand spending patterns, and stay within your trip budget with intelligent insights.',
    icon: 'account_balance_wallet',
    beta: false
  },
  {
    id: 'ai-assistant',
    title: 'AI Travel Assistant',
    description: 'Ask travel questions and get real-time recommendations while planning your trip — like a local expert in your pocket.',
    icon: 'smart_toy',
    beta: false
  },
  {
    id: 'photo-guide',
    title: 'Photo Travel Guide',
    description: 'Identify destinations from photos and learn more about the places you discover with AI-powered visual recognition.',
    icon: 'camera_alt',
    beta: true
  }
];

export function getFeatureIcon(iconName) {
  // Material Symbols icon names - used directly in JSX
  return iconName;
}
