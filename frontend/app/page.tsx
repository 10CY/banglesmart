import HeroSection from "@/components/home/HeroSection";
import CategorySection from "@/components/home/CategorySection";
import BestSellerSection from "@/components/home/BestSellerSection";
import NewArrivalSection from "@/components/home/NewArrivalSection";
import OfferBanner from "@/components/home/OfferBanner";
import TrustSection from "@/components/home/TrustSection";
import Testimonials from "@/components/home/Testimonials";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import NewsletterSection from "@/components/home/NewsletterSection";


export const metadata = {
  title: "Bangles for Women | Shop Stylish Bangles Online",

  description:
    "Shop stylish bangles for women in trendy and elegant designs. Explore beautiful bangles for everyday wear, festive occasions, weddings and special moments.",

  keywords: [
    "bangles",
    "bangles for women",
  ],
};


export default function HomePage() {

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