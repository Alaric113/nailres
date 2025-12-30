import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSeasonPasses } from '../../hooks/useSeasonPasses';
import { useSeasonPassOrder } from '../../hooks/useSeasonPassOrder';
import { ChevronLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { isLiffBrowser } from '../../lib/liff';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useGlobalSettings } from '../../hooks/useGlobalSettings';

const PurchasePassPage = () => {
  const { passId } = useParams();
  const navigate = useNavigate();
  const { passes: seasonPasses, loading: loadingPasses } = useSeasonPasses();
  const { createOrder, loading: submitting } = useSeasonPassOrder();
  const { settings, isLoading: loadingSettings } = useGlobalSettings();

  const searchParams = new URLSearchParams(window.location.search);
  const variantIndex = parseInt(searchParams.get('variant') || '0');

  const [note, setNote] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // LIFF & Bottom Nav Detection
  const isLiff = isLiffBrowser();
  const { currentUser } = useAuthStore();
  const showBottomNav = currentUser && !isLiff;
  
  // If BottomNav is visible (Mobile Web + LoggedIn), raise the footer.
  // BottomNav is hidden on lg screens, so reset to bottom-0 on lg.
  const fixedFooterClass = showBottomNav ? 'bottom-[76px] lg:bottom-0' : 'bottom-0';

  const pass = seasonPasses.find(p => p.id === passId);
  const variant = pass?.variants[variantIndex];

  if (loadingPasses || loadingSettings) return <LoadingSpinner fullScreen />;
  if (!pass || !variant) return <div className="p-8 text-center">找不到此方案</div>;

  // Use settings.bankInfo or fallbacks if not set
  const bankInfo = settings.bankInfo || {
      bankCode: '822',
      bankName: '中國信託',
      accountNumber: '123-456-789012',
      accountName: '美甲沙龍有限公司'
  };

  const handleConfirm = async () => {
    try {
      await createOrder(
        pass.id,
        pass.name,
        variant.name,
        variant.price,
        note
      );
      setIsSuccess(true);
    } catch (error) {
      alert('訂單建立失敗，請稍後再試');
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircleIcon className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">訂單已建立</h2>
        <p className="text-gray-600 mb-8">
          請於匯款完成後，等待管理員確認。<br/>
          確認無誤後，系統將自動為您開通季卡。
        </p>
        <button 
          onClick={() => navigate('/member/pass')}
          className="px-6 py-2 bg-[#9F9586] text-white rounded-lg hover:bg-[#8a8174]"
        >
          返回季卡專區
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 ml-2">確認購買</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        
        {/* Pass Info Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EFECE5]">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">購買項目</h2>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xl font-serif font-bold text-gray-900">{pass.name}</h3>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                {variant.name}
              </span>
            </div>
            <div className="text-xl font-bold text-[#9F9586]">
              ${variant.price.toLocaleString()}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            效期: {pass.duration}
          </p>
        </div>

        {/* Transfer Info */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EFECE5]">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">匯款資訊</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span>銀行代碼</span>
              <span className="font-mono font-bold">{bankInfo.bankCode} ({bankInfo.bankName})</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span>銀行帳號</span>
              <span className="font-mono font-bold text-lg text-gray-800">{bankInfo.accountNumber}</span>
            </div>
             <div className="flex justify-between">
              <span>戶名</span>
              <span className="font-bold">{bankInfo.accountName}</span>
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              匯款備註 (選填)
            </label>
            <input
              type="text"
              placeholder="請輸入帳號後五碼，以利對帳"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#9F9586] focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* Total & Action */}
        <div className={`fixed ${fixedFooterClass} left-0 right-0 p-4 bg-white border-t border-gray-100 flex items-center justify-between safe-area-pb transition-all z-20`}>
          <div>
            <span className="text-xs text-gray-500">總金額</span>
            <div className="text-2xl font-bold text-[#9F9586]">
              ${variant.price.toLocaleString()}
            </div>
          </div>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="px-8 py-3 bg-[#1a1a1a] text-white rounded-xl font-bold shadow-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? '處理中...' : '確認下單'}
          </button>
        </div>
        
        {/* Spacer for fixed bottom */}
        <div className="h-20"></div>

      </div>
    </div>
  );
};

export default PurchasePassPage;
