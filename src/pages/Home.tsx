import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Home = () => {
  const currentUser = useAuthStore((state) => state.currentUser);

  return (
    <div className="min-h-screen bg-pink-50 text-gray-800">
      {/* Hero Section */}
      <section className="text-center py-20 px-4 bg-white shadow-md">
        <h1 className="text-5xl font-bold text-pink-600 mb-4">TreeRing 美學工作室</h1>
        <p className="text-xl text-gray-600 mb-8">專為您的美麗而生，輕鬆預約您的專屬美甲時光。</p>
        <div className="flex justify-center">
          {currentUser ? (
            <Link to="/dashboard" className="px-8 py-3 bg-pink-500 text-white font-semibold rounded-full shadow-lg hover:bg-pink-600 transition-all transform hover:scale-105">
              前往儀表板
            </Link>
          ) : (
            <Link to="/login" className="px-8 py-3 bg-pink-500 text-white font-semibold rounded-full shadow-lg hover:bg-pink-600 transition-all transform hover:scale-105">
              登入立即預約
            </Link>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">我們的服務特色</h2>
        <div className="grid md:grid-cols-3 gap-10 text-center">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-2">線上即時預約</h3>
            <p>24小時開放，隨時隨地查看可預約時段，無需等待。</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-2">專業美甲師團隊</h3>
            <p>每位美甲師均經過嚴格認證，提供最專業的技術與服務。</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-2">會員專屬優惠</h3>
            <p>加入會員，享受點數累積、生日禮金等多重好康。</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;