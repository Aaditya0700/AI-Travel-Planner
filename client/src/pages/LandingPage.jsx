import HeroSection from '../components/sections/HeroSection.jsx';
import HowItWorksSection from '../components/sections/HowItWorksSection.jsx';
import CategoriesSection from '../components/sections/CategoriesSection.jsx';
import DestinationsSection from '../components/sections/DestinationsSection.jsx';
import AttractionsSection from '../components/sections/AttractionsSection.jsx';
import FoodSection from '../components/sections/FoodSection.jsx';
import ItineraryPreviewSection from '../components/sections/ItineraryPreviewSection.jsx';
import FeaturesSection from '../components/sections/FeaturesSection.jsx';
import BudgetPreviewSection from '../components/sections/BudgetPreviewSection.jsx';
import CtaSection from '../components/sections/CtaSection.jsx';
import Footer from '../components/sections/Footer.jsx';

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <CategoriesSection />
      <DestinationsSection />
      <AttractionsSection />
      <FoodSection />
      <ItineraryPreviewSection />
      <FeaturesSection />
      <BudgetPreviewSection />
      <CtaSection />
      <Footer />
    </>
  );
}