import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

import HeroSection from '../components/home/HeroSection';
import ServiceHighlights from '../components/home/ServiceHighlights';
import PortfolioSection from '../components/home/PortfolioSection';
import Footer from '../components/home/Footer';
import CustomerReviews from '../components/home/CustomerReviews';

const LandingPage = () => {
  const [homepageImages, setHomepageImages] = useState<{
    beforeAfter: { before: string; after: string };
    lashImages: string[];
    nailImages: string[];
    browImages: string[];
  }>({
    beforeAfter: { before: '', after: '' },
    lashImages: [],
    nailImages: [],
    browImages: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [heroImage, setHeroImage] = useState('');

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const docRef = doc(db, 'globals', 'homepageImages');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          setHomepageImages(data);
          // Select a random hero image from lashes if available
          if (data.lashImages && data.lashImages.length > 0) {
            setHeroImage(data.lashImages[Math.floor(Math.random() * data.lashImages.length)]);
          }
        }
      } catch (error) {
        console.error("Error fetching homepage images:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchImages();
  }, []);

  // Services Data
  const categories = [
    {
      title: '韓式霧眉',
      price: 5500,
      description: 'POWDER BROWS',
      highlights: ['日式嫁接', '自然濃密', '持久舒適'],
      link: '/booking?category=霧眉',
      imglink: homepageImages.browImages[0] || ''
    },
    {
      title: '日式美睫',
      price: 1000,
      description: 'EYELASH',
      highlights: ['韓式霧眉', '客製設計', '自然妝感'],
      link: '/booking?category=美睫',
      imglink: homepageImages.lashImages[0] || ''
    },
    {
      title: '質感美甲',
      price: 1000,
      description: 'NAILS',
      highlights: ['凝膠指甲', '手繪設計', '保養護理'],
      link: '/booking?category=美甲',
      imglink: homepageImages.nailImages[0] || ''
    },
  ];

  return (
    // Main Container with Snap Scroll
    // Main Container - Magazine Style with Snap Scroll
    <div className="bg-[#FAF9F6] text-text-main h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth selection:bg-primary/20">
      
      <HeroSection heroImage={heroImage} />

      <ServiceHighlights categories={categories} />

      <PortfolioSection 
        beforeAfter={homepageImages.beforeAfter} 
        galleryImages={[...homepageImages.lashImages, ...homepageImages.nailImages].slice(0, 8)} // Combine for gallery, limit to 8
        isLoading={isLoading} 
      />

      <CustomerReviews />

      <Footer />

    </div>
  );
};

export default LandingPage;
