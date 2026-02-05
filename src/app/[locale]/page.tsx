import { setRequestLocale } from 'next-intl/server';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Stats from '@/components/landing/Stats';
import HowItWorks from '@/components/landing/HowItWorks';
import AIServices from '@/components/landing/AIServices';
import CompetitorComparison from '@/components/landing/CompetitorComparison';
import Pricing from '@/components/landing/Pricing';
import Testimonials from '@/components/landing/Testimonials';
import FAQ from '@/components/landing/FAQ';
import CTA from '@/components/landing/CTA';
import Footer from '@/components/landing/Footer';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Navbar />
      <Hero />
      <HowItWorks />
      <AIServices />
      <CompetitorComparison />
      <Pricing />
      <Stats />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
}
