import React from 'react';
import { HeroSection } from '../ui/sections/HeroSection';
import { StatsSection } from '../ui/sections/StatsSection';
import { FeaturesSection } from '../ui/sections/FeaturesSection';
import { HowItWorksSection } from '../ui/sections/HowItWorksSection';
import { CTASection } from '../ui/sections/CTASection';

const LandingPage: React.FC = () => {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
    </>
  );
};

export default LandingPage;
