import { HeroSection } from "@/components/landing/hero-section";
import { BenefitsSection } from "@/components/landing/benefits-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { UseCasesSection } from "@/components/landing/use-cases-section";
import { SocialProofSection } from "@/components/landing/social-proof-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { FAQSection } from "@/components/landing/faq-section";
import { FinalCTASection } from "@/components/landing/final-cta-section";
import Image from "next/image";

export default function HomePage() {
  return (
    <>
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
      <footer className="bg-black text-white border-t border-white/10">
        <div className="container mx-auto px-6 py-10 flex flex-col items-center gap-4">
          <Image
            src="/images/logo.svg"
            alt="Continuum AI"
            width={60}
            height={60}
            priority
          />
          <p className="text-sm text-white/80">
            © {new Date().getFullYear()} Continuum AI. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </>
  );
}
