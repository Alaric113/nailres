import LoyaltyCard from '../components/dashboard/LoyaltyCard';
import FloatingBookingBtn from '../components/dashboard/FloatingBookingBtn';
import UpcomingBookingWidget from '../components/dashboard/UpcomingBookingWidget';
import PromoSlider from '../components/dashboard/PromoSlider';

const Dashboard = () => {
  return (
    // Dashboard Home Feed
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 pb-24 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* 1. Loyalty Card */}
        <LoyaltyCard />

        {/* 2. Upcoming Booking Alert (Conditional) */}
        <UpcomingBookingWidget />

        {/* 3. Promo/Image Slider */}
        <div>
          <h3 className="text-lg font-serif font-bold text-gray-900 mb-3 px-1">最新活動</h3>
          <PromoSlider />
        </div>

        {/* 4. Placeholder for other home feed content */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-4 rounded-2xl border border-[#EFECE5] shadow-sm flex flex-col items-center justify-center h-32">
              <span className="text-2xl mb-2">💅</span>
              <span className="text-sm font-medium text-gray-600">本月設計</span>
           </div>
           <div className="bg-white p-4 rounded-2xl border border-[#EFECE5] shadow-sm flex flex-col items-center justify-center h-32">
              <span className="text-2xl mb-2">🏷️</span>
              <span className="text-sm font-medium text-gray-600">領取優惠</span>
           </div>
        </div>

      </div>

      <FloatingBookingBtn />
    </div>
  );
};

export default Dashboard;


