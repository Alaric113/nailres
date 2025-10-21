import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import iconImage from '../assets/icon.jpg'; // 匯入您的圖示

// Placeholder images (replace with your actual image paths)
const nailImages = [
  'https://via.placeholder.com/800x600/fecdd3/9f1239?text=Nail+Art+1',
  'https://via.placeholder.com/800x600/fbcfe8/861955?text=Nail+Art+2',
  'https://via.placeholder.com/800x600/f5d0fe/7e22ce?text=Nail+Art+3',
];

const lashImages = [
  'https://firebasestorage.googleapis.com/v0/b/nail-62ea4.firebasestorage.app/o/mdoel_2.jpg?alt=media&token=863e8dce-e08f-48d8-a574-dd0dedc9af96',
  'https://firebasestorage.googleapis.com/v0/b/nail-62ea4.firebasestorage.app/o/model_1.jpg?alt=media&token=933a5950-353c-4633-b270-17c4b0b578df',
  
];

const Home = () => {
  const { currentUser } = useAuthStore();

  const renderAuthButton = () => {
    if (currentUser) {
      return (
        <Link
          to="/dashboard"
          className="inline-block bg-white text-pink-600 font-bold rounded-full py-4 px-8 text-lg shadow-lg hover:bg-pink-50 transition-transform transform hover:scale-105"
        >
          前往儀表板
        </Link>
      );
    }
    return (
      <Link
        to="/login"
        className="inline-block bg-white text-pink-600 font-bold rounded-full py-4 px-8 text-lg shadow-lg hover:bg-pink-50 transition-transform transform hover:scale-105"
      >
        立即預約 / 登入
      </Link>
    );
  };

  const SocialButton = ({ href, label }: { href: string; label: string }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="block w-10 h-10 rounded-full overflow-hidden hover:opacity-80 transition-opacity">
      <img src={iconImage} alt={label} className="w-full h-full object-cover" />
    </a>
  );

  return (
    <div className="bg-gray-50 text-gray-800">
      {/* Hero Section */}
      <header className="relative bg-pink-500 text-white text-center py-20 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 opacity-80"></div>
        <div className="relative z-10">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4">
            TreeRing美學工作室
          </h1>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-pink-100 mb-8">
            專業美甲與美睫服務，為您打造專屬的精緻美麗。
          </p>
          {renderAuthButton()}
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Nail Art Showcase */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-8">精選美甲作品</h2>
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            loop={true}
            className="rounded-lg shadow-xl"
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 20 },
              1024: { slidesPerView: 3, spaceBetween: 30 },
            }}
          >
            {nailImages.map((src, index) => (
              <SwiperSlide key={`nail-${index}`}>
                <img src={src} alt={`Nail Art ${index + 1}`} className="w-full h-64 object-cover rounded-lg" />
              </SwiperSlide>
            ))}
          </Swiper>
        </section>

        {/* Lash Style Showcase */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">魅力美睫造型</h2>
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={2}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            loop={true}
            className="rounded-lg shadow-xl"
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 20 },
              1024: { slidesPerView: 3, spaceBetween: 30 },
            }}
          >
            {lashImages.map((src, index) => (
              <SwiperSlide key={`lash-${index}`}>
                <img src={src} alt={`Lash Style ${index + 1}`} className="w-full h-64 object-cover rounded-lg" />
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            {/* About */}
            <div className="md:col-span-1">
              <h3 className="text-lg font-semibold mb-4">關於我們</h3>
              <p className="text-gray-400">
                我們致力於提供最專業、最細緻的美甲與美睫服務，讓每一位顧客都能帶著滿意的微笑離開。
              </p>
            </div>

            {/* Location */}
            <div className="md:col-span-1">
              <div className="bg-gray-700 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">店鋪資訊</h3>
                <div className="space-y-2 text-gray-300">
                  <p>
                    <strong className="font-medium text-white">地址：</strong>
                    台北市信義區信義路五段7號 (台北101)
                  </p>
                  <p>
                    <strong className="font-medium text-white">交通：</strong>
                    捷運台北101/世貿站 4號出口，步行約 1 分鐘。
                  </p>
                  <p>
                    <strong className="font-medium text-white">營業時間：</strong>
                    每日 10:00 - 19:00
                  </p>
                </div>
              </div>
            </div>

            {/* Social */}
            <div className="md:col-span-1 flex flex-col items-center md:items-end">
              <h3 className="text-lg font-semibold mb-4">關注我們</h3>
              <div className="flex space-x-6">
                <SocialButton href="https://instagram.com" label="Instagram" />
                <SocialButton href="https://facebook.com" label="Facebook" />
                <SocialButton href="https://line.me" label="LINE" />
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Nail Salon. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
