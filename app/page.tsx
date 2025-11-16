import { HeroSection } from "@/components/landing/hero-section";
import { BenefitsSection } from "@/components/landing/benefits-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { UseCasesSection } from "@/components/landing/use-cases-section";
import { SocialProofSection } from "@/components/landing/social-proof-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { FAQSection } from "@/components/landing/faq-section";
import { FinalCTASection } from "@/components/landing/final-cta-section";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <BenefitsSection />
      <FeaturesSection />
      <UseCasesSection />
      <SocialProofSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
    </main>
  );
}
