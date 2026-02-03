import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Stats from '@/components/landing/Stats';
import FeaturedAgents from '@/components/landing/FeaturedAgents';
import HowItWorks from '@/components/landing/HowItWorks';
import Testimonials from '@/components/landing/Testimonials';
import CTA from '@/components/landing/CTA';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Stats />
      <FeaturedAgents />
      <HowItWorks />
      <Testimonials />
      <CTA />
      <Footer />
    </>
  );
}
