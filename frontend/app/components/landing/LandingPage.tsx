import { LandingNavbar } from "./LandingNavbar";
import { HeroSection } from "./HeroSection";
import { FeaturesSection } from "./FeaturesSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { SecuritySection } from "./SecuritySection";
import { AISection } from "./AISection";
import { RoleSection } from "./RoleSection";
import { FinalCTA } from "./FinalCTA";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <div className="landing-root">
      <LandingNavbar />
      <main id="main-content">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SecuritySection />
        <AISection />
        <RoleSection />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
