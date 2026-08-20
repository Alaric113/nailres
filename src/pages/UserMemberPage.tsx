import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Calendar, 
  Ticket, 
  Gift, 
  CreditCard, 
  Clock, 
  ChevronRight, 
  MapPin, 
  Image as ImageIcon, 
  LogOut, 
  Sliders, 
  HelpCircle,
  ArrowUpRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useActivePass } from '../hooks/useActivePass';
import { useBookings } from '../hooks/useBookings';
import { useUserCoupons } from '../hooks/useUserCoupons';
import { useUserGiftCards } from '../hooks/useUserGiftCards';
import LoyaltyCard from '../components/dashboard/LoyaltyCard';
import SeasonPassCard from '../components/dashboard/SeasonPassCard';
import Modal from '../components/common/Modal';
import { format, isBefore } from 'date-fns';

const UserMemberPage = () => {
  const { logout, userProfile } = useAuthStore();
  const { activePasses } = useActivePass();
  const { bookings } = useBookings();
  const { userCoupons } = useUserCoupons();
  const { userGiftCards } = useUserGiftCards();
  const navigate = useNavigate();

  // State
  const [activeCardTab, setActiveCardTab] = useState<'loyalty' | 'pass'>('loyalty');
  const [activePassIndex, setActivePassIndex] = useState(0);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRightsModalOpen, setIsRightsModalOpen] = useState(false);

  // Compute Active / Upcoming Data
  const now = new Date();
  const upcomingBookings = bookings
    .filter(b => !isBefore(b.dateTime, now) && !['completed', 'cancelled'].includes(b.status))
    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  const nextBooking = upcomingBookings[0];

  const activeCouponsCount = userCoupons.filter(
    c => c.status === 'active' && c.validUntil.seconds * 1000 > Date.now()
  ).length;

  const activeGiftCardsCount = userGiftCards.filter(
    g => g.status === 'active'
  ).length;

  const loyaltyPoints = userProfile?.loyaltyPoints || 0;

  // Membership Role Check
  const role = userProfile?.role;
  const isStaffOrAdmin = ['admin', 'manager', 'designer'].includes(role || '');

  const handleLogoutConfirm = async () => {
    setIsLogoutModalOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-28 md:pb-16 text-text-main selection:bg-primary/20">
      {/* Top Ambient Glow Decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-gradient-to-b from-[#EFECE5]/60 via-[#FAF9F6]/30 to-transparent pointer-events-none -z-10 blur-2xl" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6 sm:space-y-7">
        
        {/* ========================================================================= */}
        {/* 1. TOP HEADER BAR WITH TITLE & CONTROLS                                  */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 tracking-tight">
              會員中心
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {isStaffOrAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white border border-[#EFECE5] text-xs sm:text-sm font-medium text-gray-700 hover:bg-[#9F9586] hover:text-white hover:border-[#9F9586] transition-all shadow-subtle active:scale-95 cursor-pointer"
                title="管理員工作台"
              >
                <Sliders className="w-4 h-4" />
                <span className="hidden sm:inline">管理後台</span>
              </button>
            )}

            <button
              onClick={() => setIsRightsModalOpen(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white border border-[#EFECE5] text-xs sm:text-sm font-medium text-gray-700 hover:bg-secondary-light transition-all shadow-subtle active:scale-95 cursor-pointer flex items-center gap-1.5"
              title="會員權益須知"
            >
              <HelpCircle className="w-4 h-4 text-[#9F9586]" />
              <span className="hidden sm:inline">會員須知</span>
            </button>

            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white border border-[#EFECE5] text-xs sm:text-sm font-medium text-gray-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-subtle active:scale-95 cursor-pointer flex items-center gap-1.5"
              title="登出帳號"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">登出</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. DIGITAL MEMBERSHIP CARD DECK (AT THE VERY TOP)                       */}
        {/* ========================================================================= */}
        <section className="space-y-3">
          {/* Card Tab Switcher (if user holds active season passes) */}
          {activePasses.length > 0 && (
            <div className="flex justify-center">
              <div className="inline-flex bg-[#EFECE5]/90 backdrop-blur-sm p-1 rounded-2xl gap-1 shadow-subtle">
                <button
                  onClick={() => setActiveCardTab('loyalty')}
                  className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeCardTab === 'loyalty'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  會員集點卡
                </button>
                <button
                  onClick={() => setActiveCardTab('pass')}
                  className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeCardTab === 'pass'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  季卡/年卡 ({activePasses.length})
                </button>
              </div>
            </div>
          )}

          {/* Card View Container */}
          <div className="w-full flex justify-center overflow-x-auto pb-1">
            <div className="w-full max-w-lg min-w-[300px] xs:min-w-[320px] sm:min-w-[360px]">
              {activeCardTab === 'loyalty' || activePasses.length === 0 ? (
                <motion.div
                  key="loyalty-card-view"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="w-full"
                >
                  <LoyaltyCard />
                </motion.div>
              ) : (
                <motion.div
                  key="pass-card-view"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3 w-full"
                >
                  <SeasonPassCard pass={activePasses[activePassIndex]} />

                  {/* Multi-pass selector dots */}
                  {activePasses.length > 1 && (
                    <div className="flex justify-center items-center gap-2 pt-1">
                      {activePasses.map((pass, idx) => (
                        <button
                          key={pass.passId}
                          onClick={() => setActivePassIndex(idx)}
                          className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                            idx === activePassIndex
                              ? 'w-6 bg-[#9F9586]'
                              : 'w-2 bg-gray-300 hover:bg-gray-400'
                          }`}
                          aria-label={`Select pass ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Point policy hint under card */}
          <div className="w-full max-w-lg min-w-[300px] xs:min-w-[320px] sm:min-w-[360px] mx-auto bg-white rounded-2xl px-4 py-3 border border-[#EFECE5] flex items-center justify-between text-xs text-text-main shadow-subtle">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#9F9586] shrink-0" />
              <span>每消費 NT$1,000 累積 1 點，可兌換專屬好禮</span>
            </div>
            <button
              onClick={() => navigate('/member/coupons')}
              className="text-[#9F9586] hover:text-[#8A8173] font-bold text-nowrap ml-2 cursor-pointer"
            >
              兌換明細 →
            </button>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. 4-GRID QUICK ASSET STATS RIBBON                                       */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          
          {/* 1. Points */}
          <button
            onClick={() => navigate('/member/coupons')}
            className="group bg-white rounded-2xl p-4 sm:p-5 border border-[#EFECE5] shadow-soft hover:shadow-medium hover:border-[#9F9586]/40 transition-all text-left flex items-center justify-between cursor-pointer active:scale-[0.98]"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-text-light font-medium">
                <Gift className="w-3.5 h-3.5 text-[#9F9586]" />
                <span>累積點數</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 group-hover:text-[#9F9586] transition-colors">
                  {loyaltyPoints}
                </span>
                <span className="text-xs text-text-light font-medium">pt</span>
              </div>
              <p className="text-[10px] text-text-light/80">兌換精選好禮 →</p>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FAF9F6] border border-[#EFECE5] flex items-center justify-center text-[#9F9586] group-hover:bg-[#9F9586] group-hover:text-white transition-all">
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </button>

          {/* 2. Coupons */}
          <button
            onClick={() => navigate('/member/coupons')}
            className="group bg-white rounded-2xl p-4 sm:p-5 border border-[#EFECE5] shadow-soft hover:shadow-medium hover:border-[#9F9586]/40 transition-all text-left flex items-center justify-between cursor-pointer active:scale-[0.98]"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-text-light font-medium">
                <Ticket className="w-3.5 h-3.5 text-[#9F9586]" />
                <span>可用票券</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 group-hover:text-[#9F9586] transition-colors">
                  {activeCouponsCount + activeGiftCardsCount}
                </span>
                <span className="text-xs text-text-light font-medium">張</span>
              </div>
              <p className="text-[10px] text-text-light/80">優惠券與商品卡 →</p>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FAF9F6] border border-[#EFECE5] flex items-center justify-center text-[#9F9586] group-hover:bg-[#9F9586] group-hover:text-white transition-all">
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </button>

          {/* 3. Upcoming Bookings */}
          <button
            onClick={() => navigate('/member/history')}
            className="group bg-white rounded-2xl p-4 sm:p-5 border border-[#EFECE5] shadow-soft hover:shadow-medium hover:border-[#9F9586]/40 transition-all text-left flex items-center justify-between cursor-pointer active:scale-[0.98]"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-text-light font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#9F9586]" />
                <span>進行中預約</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 group-hover:text-[#9F9586] transition-colors">
                  {upcomingBookings.length}
                </span>
                <span className="text-xs text-text-light font-medium">場</span>
              </div>
              <p className="text-[10px] text-text-light/80">查看預約時段 →</p>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FAF9F6] border border-[#EFECE5] flex items-center justify-center text-[#9F9586] group-hover:bg-[#9F9586] group-hover:text-white transition-all">
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </button>

          {/* 4. Active Season Passes */}
          <button
            onClick={() => navigate('/member/pass')}
            className="group bg-white rounded-2xl p-4 sm:p-5 border border-[#EFECE5] shadow-soft hover:shadow-medium hover:border-[#9F9586]/40 transition-all text-left flex items-center justify-between cursor-pointer active:scale-[0.98]"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-text-light font-medium">
                <CreditCard className="w-3.5 h-3.5 text-[#9F9586]" />
                <span>專屬季卡</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 group-hover:text-[#9F9586] transition-colors">
                  {activePasses.length}
                </span>
                <span className="text-xs text-text-light font-medium">張</span>
              </div>
              <p className="text-[10px] text-text-light/80">
                {activePasses.length > 0 ? '檢視卡券權益 →' : '購買方案享優惠 →'}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FAF9F6] border border-[#EFECE5] flex items-center justify-center text-[#9F9586] group-hover:bg-[#9F9586] group-hover:text-white transition-all">
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </button>

        </section>

        {/* ========================================================================= */}
        {/* 4. UPCOMING APPOINTMENT PREVIEW                                          */}
        {/* ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#9F9586]" />
              即將到來的預約
            </h2>
            <button
              onClick={() => navigate('/member/history')}
              className="text-xs text-[#9F9586] hover:text-[#8A8173] font-semibold transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              全部預約紀錄
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {nextBooking ? (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#EFECE5] shadow-soft hover:shadow-medium transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#9F9586]/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      已確認預約
                    </span>
                    <span className="text-xs text-text-light">
                      編號 #{nextBooking.id.slice(-6).toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    {nextBooking.serviceName}
                  </h3>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-text-light">
                    <div className="flex items-center gap-1.5 text-gray-800 font-medium">
                      <Calendar className="w-4 h-4 text-[#9F9586]" />
                      <span>{format(nextBooking.dateTime, 'yyyy/MM/dd (eee)')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-800 font-medium">
                      <Clock className="w-4 h-4 text-[#9F9586]" />
                      <span>{format(nextBooking.dateTime, 'HH:mm')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#9F9586]" />
                      <span>設計師: {nextBooking.designerName || '不指定設計師'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <button
                    onClick={() => navigate(`/orders/${nextBooking.id}`)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-[#9F9586] text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-[#8A8173] transition-all shadow-sm active:scale-95 text-center cursor-pointer"
                  >
                    查看詳情
                  </button>
                  <button
                    onClick={() => navigate(`/member/reschedule/${nextBooking.id}`)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-[#FAF9F6] text-text-main border border-[#EFECE5] text-xs sm:text-sm font-medium rounded-xl hover:bg-[#EFECE5] transition-all active:scale-95 text-center cursor-pointer"
                  >
                    線上改期
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-dashed border-[#EFECE5] text-center space-y-3 shadow-subtle">
              <div className="w-10 h-10 rounded-full bg-[#FAF9F6] border border-[#EFECE5] flex items-center justify-center mx-auto text-[#9F9586]">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">目前尚無待出發的預約</h3>
                <p className="text-xs text-text-light mt-0.5">挑選喜愛的美甲、美睫或霧眉服務，為自己預約專屬美麗時段</p>
              </div>
              <button
                onClick={() => navigate('/booking')}
                className="inline-flex items-center gap-2 px-5 py-2 bg-[#9F9586] text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-[#8A8173] transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                立即線上預約
              </button>
            </div>
          )}
        </section>

      

      </div>

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* 1. LOGOUT CONFIRMATION MODAL */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="確認登出"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-text-main">
            您確定要登出目前帳號嗎？登出後需重新登入方可查看專屬會員點數與預約紀錄。
          </p>

          <div className="flex gap-3 pt-3">
            <button
              onClick={() => setIsLogoutModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              onClick={handleLogoutConfirm}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs sm:text-sm font-bold hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
            >
              確認登出
            </button>
          </div>
        </div>
      </Modal>

      {/* 2. MEMBER RIGHTS MODAL */}
      <Modal
        isOpen={isRightsModalOpen}
        onClose={() => setIsRightsModalOpen(false)}
        title="TREERING 會員權益須知"
      >
        <div className="space-y-4 pt-2 text-xs sm:text-sm text-text-main max-h-[65vh] overflow-y-auto pr-1">
          <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#EFECE5] space-y-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#9F9586] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-gray-900">消費點數回饋</h4>
                <p className="text-text-light text-xs mt-0.5">每消費 NT$1,000 即可累積 1 點，點數可用於兌換限定折價券與店內精緻保養禮遇。</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#9F9586] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-gray-900">預約與線上改期</h4>
                <p className="text-text-light text-xs mt-0.5">為維護服務品質，預約時段 72 小時前可於會員系統免費線上改期 1 次。如遇特殊狀況請洽 LINE 客服。</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#9F9586] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-gray-900">季卡方案使用條款</h4>
                <p className="text-text-light text-xs mt-0.5">季卡方案限本人使用，各項權益與服務次數請於有效期限內使用完畢。</p>
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => setIsRightsModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#9F9586] text-white font-bold text-xs sm:text-sm hover:bg-[#8A8173] transition-colors shadow-sm cursor-pointer"
            >
              了解並關閉
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default UserMemberPage;
