import { Link } from 'react-router-dom';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import BeforeAfterSlider from '../components/BeforeAfterSlider'; // 引入前後對比元件

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const lashImages = [
  'https://firebasestorage.googleapis.com/v0/b/nail-62ea4.firebasestorage.app/o/mdoel_2.jpg?alt=media&token=863e8dce-e08f-48d8-a574-dd0dedc9af96',
  'https://firebasestorage.googleapis.com/v0/b/nail-62ea4.firebasestorage.app/o/model_1.jpg?alt=media&token=933a5950-353c-4633-b270-17c4b0b578df',
];

// 服務項目資料
// 將服務項目改為服務分類，並移除圖片
const categories = [
  {
    title: '美睫服務',
    description: '打造迷人電眼，多種款式與材質選擇。',
    link: '/booking?category=美睫',
  },
  {
    title: '霧眉服務',
    description: '專業霧眉技術，讓您擁有自然持久的完美眉型。',
    link: '/booking?category=霧眉',
  },
  {
    title: '美甲服務',
    description: '從基礎保養到精緻設計，讓您的指尖綻放光彩。',
    link: '/booking?category=美甲',
  },
];

const Home = () => {
  return (
    <div className="bg-gray-50 text-gray-800 h-screen overflow-y-scroll snap-y snap-mandatory">
      {/* Hero Section */}
      <header className="relative h-screen min-h-[600px] flex items-center justify-center text-center text-white overflow-hidden pt-[72px] snap-start">
        {/* Background Image with Parallax effect */}
        <div
          className="absolute inset-0 bg-cover bg-fixed bg-center"
          style={{ backgroundImage: "url('https://firebasestorage.googleapis.com/v0/b/nail-62ea4.firebasestorage.app/o/logo.jpg?alt=media&token=37e1e109-cf49-4806-b1fb-7bde26cc4015')", transform: 'scale(1.05)' }}
        ></div>
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 max-w-3xl px-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            TreeRing美學工作室
          </h1>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-200 mb-8" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            專業美甲與美睫服務，為您打造專屬的精緻美麗。
          </p>
          <Link
            to="/login"
            className="inline-block bg-[#E97EB5] text-white font-bold rounded-full py-4 px-10 text-lg shadow-xl hover:bg-[#C96495] transition-all transform hover:scale-105 active:scale-100"
          >
            立即預約
          </Link>
        </div>
      </header>

      <main>
        

        {/* Works Section */}
        <section id="works" className="py-16 sm:py-20 snap-start">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-4">作品集</h2>
            <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">拖曳中間的滑桿，查看我們為顧客帶來的驚喜改變。</p>
            <BeforeAfterSlider
              beforeImage="https://firebasestorage.googleapis.com/v0/b/nail-62ea4.firebasestorage.app/o/bf_1.jpg?alt=media&token=76199628-9c27-4859-96c4-6a6daa590c82"
              afterImage="https://firebasestorage.googleapis.com/v0/b/nail-62ea4.firebasestorage.app/o/af_1.jpg?alt=media&token=b8be2d3a-32de-403d-98d4-f638812f2317"
            />
          </div>
        </section>

        {/* Lash Style Showcase */}
        <section className="py-16 sm:py-20 bg-pink-50/50 snap-start">
          <h2 className="text-3xl font-bold text-center mb-12">更多作品展示</h2>
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            loop={true}
            className="max-w-6xl mx-auto px-4"
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 20 },
              1024: { slidesPerView: 3, spaceBetween: 30 },
            }}
          >
            {lashImages.map((src, index) => (
              <SwiperSlide key={`lash-${index}`}>
                <img src={src} alt={`Lash Style ${index + 1}`} className="w-full h-80 object-cover rounded-lg shadow-xl" />
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
        

        {/* Services Section */}
        <section id="services" className="py-16 sm:py-20 bg-white snap-start">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-4">服務項目</h2>
            <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">我們提供多樣化的專業服務，滿足您對美的所有想像。</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.map((category) => (
                <div key={category.title} className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden flex flex-col transform hover:-translate-y-2 transition-transform duration-300">
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold mb-2 text-center">{category.title}</h3>
                    <p className="text-gray-600 mb-4 flex-grow text-center">{category.description}</p>
                    <div className="flex justify-center items-center mt-4">
                      {/* <span className="text-lg font-bold text-pink-500">NT$ {category.price} 起</span> */}
                      <Link to={category.link} className="bg-pink-500 text-white font-semibold rounded-lg py-2 px-4 text-sm hover:bg-pink-600 transition-colors">
                        查看詳情
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white snap-start">
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
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">店鋪資訊</h3>
                <div className="space-y-2 text-gray-300">
                  <p>
                    <strong className="font-medium text-white">地址：</strong>
                    新北市蘆洲區民權路68巷16號1樓
                  </p>
                  <p>
                    <strong className="font-medium text-white">交通：</strong>
                    三民高中捷運站2號出口 步行5分鐘
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
                <a href="https://www.instagram.com/treering_83/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">Instagram</a>
                <a href="https://www.facebook.com/share/19Z1mqXuKG/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">Facebook</a>
                <a href="https://www.tiktok.com/@treering_83?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">TikTok</a>
                <a href="https://page.line.me/985jirte" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">LINE</a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700/50 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} TreeRing Studio. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
