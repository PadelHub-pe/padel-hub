import { Separator } from "@wifo/ui/separator";

import { HeroSection } from "~/components/hero/hero-section";
import { SiteFooter } from "~/components/layout/site-footer";
import { SiteHeader } from "~/components/layout/site-header";
import { AppDownloadCTA } from "~/components/marketing/app-download-cta";
import { DistrictCarousel } from "~/components/marketing/district-carousel";
import { FeaturedCourtsSection } from "~/components/marketing/featured-courts-section";
import { HowItWorks } from "~/components/marketing/how-it-works";
import { StatsCounter } from "~/components/marketing/stats-counter";
import { TestimonialSection } from "~/components/marketing/testimonial-section";
import { WaitlistCTASection } from "~/components/marketing/waitlist-cta-section";
import {
  OrganizationSchema,
  WebSiteSchema,
} from "~/components/seo/structured-data";
import { api } from "~/trpc/server";

export default async function HomePage() {
  const caller = await api();
  const featured = await caller.publicFacility.getFeatured({ limit: 6 });

  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />

      <SiteHeader />

      <main>
        {/* 1. Hero with search */}
        <HeroSection />

        {/* 2. Social proof numbers */}
        <StatsCounter />

        {/* 3. Explore by district */}
        <DistrictCarousel />

        {/* 4. Featured Courts */}
        <FeaturedCourtsSection facilities={featured} />

        {/* 5. How It Works */}
        <HowItWorks />

        {/* 6. Testimonials */}
        <TestimonialSection />

        <Separator />

        {/* 7. App Download CTA */}
        <AppDownloadCTA />

        {/* 8. Waitlist CTA */}
        <WaitlistCTASection />
      </main>

      <SiteFooter />
    </>
  );
}
