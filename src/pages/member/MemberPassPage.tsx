

import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useSeasonPasses } from '../../hooks/useSeasonPasses';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import MemberPassCarousel from '../../components/member/MemberPassCarousel';

const MemberPassPage = () => {
  const navigate = useNavigate();
  const { passes, loading, error } = useSeasonPasses();

  // Filter active passes only
  const activePasses = passes.filter(p => p.isActive);

  return (
    <div className="h-[calc(100vh-64px)] bg-[#FAF9F6] flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-3 shadow-sm z-10 flex items-center gap-2 shrink-0">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">季卡/年卡方案</h1>
      </div>

      <div className="flex-1 overflow-hidden relative">
         {loading ? (
            <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>
         ) : error ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
                <p className="text-red-500 font-bold mb-2">無法讀取方案資料</p>
                <p className="text-sm mb-4 bg-red-50 p-2 rounded text-red-700 font-mono text-left max-w-xs overflow-auto">
                    {error}
                </p>
                <p className="text-xs text-gray-400">請確認網路連線或聯繫管理員 (Firebase Rules)</p>
            </div>
         ) : activePasses.length > 0 ? (
            <div className="h-full overflow-hidden">
                <MemberPassCarousel passes={activePasses} />
            </div>
         ) : (
            <div className="text-center py-10 text-gray-500">目前沒有可用的方案</div>
         )}
      </div>
    </div>
  );
};

export default MemberPassPage;
