import HeroSection from "@/components/home/HeroSection";
import CategorySection from "@/components/home/CategorySection";
import BestSellerSection from "@/components/home/BestSellerSection";
import NewArrivalSection from "@/components/home/NewArrivalSection";
import OfferBanner from "@/components/home/OfferBanner";
import TrustSection from "@/components/home/TrustSection";
import Testimonials from "@/components/home/Testimonials";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import NewsletterSection from "@/components/home/NewsletterSection";


export default function HomePage(){

  return (

    <main>

      <HeroSection />

      <CategorySection />

      <BestSellerSection />

      <NewArrivalSection />

      <OfferBanner />

      <TrustSection />

      <Testimonials />

      <WhyChooseUs />

      <NewsletterSection />

    </main>

  );

}